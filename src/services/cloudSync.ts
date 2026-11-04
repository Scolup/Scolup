// Synchronisation entre appareils, sans serveur : uniquement le cloud
// EcoleDirecte de l'élève, via Litedirecte.
//
// Principe : chaque appareil écrit UN fichier à lui (`Scolup/sync-<id>.json`)
// qui contient son état complet, déjà fusionné avec ce qu'il connaît des
// autres. À chaque passage on lit les fichiers des autres, on fusionne (règles
// commutatives, voir features/sync/merge.ts), puis on réécrit le sien si
// quelque chose a changé. Personne n'écrase le fichier d'un autre, et les
// écritures simultanées se rattrapent d'elles-mêmes au passage suivant.

import { reloadRubies } from "@/features/shop/rubies"
import { refreshQuests } from "@/features/quests/service"
import { reloadSubjects } from "@/features/subjects/store"
import {
  DOC_VERSION,
  fingerprint,
  parseDoc,
  type SyncDoc,
} from "@/features/sync/document"
import { groupByDevice, syncFileName } from "@/features/sync/files"
import { SETTINGS_SYNCED_EVENT } from "@/features/sync/keys"
import {
  ensureSyncFolder,
  listSyncFolder,
  readText,
  removeNodes,
  writeText,
} from "./cloudTransport"
import { ld } from "./litedirecte"
import { mergeIntoLocal, type Applied } from "./syncState"
import type { SyncState } from "@/features/sync/document"
import { onDirty } from "./syncSignal"

const DEVICE_KEY = "scolup-device-id" // propre à l'appareil : jamais synchronisé
const FINGERPRINT_KEY = "scolup-sync-fingerprint"
const REV_KEY = "scolup-sync-rev"
const STALE_MS = 60 * 24 * 3600 * 1000 // un appareil muet depuis 60 j est oublié
const DEBOUNCE_MS = 1500
const MAX_PASSES = 3

function encodeBase64(text: string): string {
  return btoa(text)
}

function decodeBase64(text: string): string {
  try {
    return atob(text)
  } catch {
    // Si ce n'est pas du base64 valide (fichier ancien), on renvoie tel quel
    // pour tenter un parsing JSON direct.
    return text
  }
}

let memoryDeviceId: string | null = null

function deviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_KEY)
    if (stored && /^[a-z0-9]{8,32}$/.test(stored)) return stored
  } catch {
    // localStorage indisponible : on se rabat sur la mémoire.
  }
  if (!memoryDeviceId) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    memoryDeviceId = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("")
  }
  try {
    localStorage.setItem(DEVICE_KEY, memoryDeviceId)
  } catch {
    // Sans stockage, l'appareil aura un nouvel id à chaque lancement.
  }
  return memoryDeviceId
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Pire cas : on renverra le fichier une fois de trop.
  }
}

// ---- État visible (pour une future ligne « dernière synchro » dans les réglages)

export interface SyncStatus {
  state: "idle" | "syncing" | "error"
  lastSync: number | null
  error?: string
}

let status: SyncStatus = { state: "idle", lastSync: null }
const statusListeners = new Set<() => void>()

function setStatus(next: SyncStatus) {
  status = next
  for (const listener of statusListeners) listener()
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function onSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

// ---- Un passage ---------------------------------------------------------------

function applyToUi(applied: Applied, state: SyncState): void {
  if (applied.wallet) void reloadRubies()
  if (applied.quests) refreshQuests()
  if (applied.subjects) void reloadSubjects()
  if (applied.settings.length > 0) {
    for (const key of applied.settings) {
      try {
        localStorage.setItem(
          `scolup:${key}`,
          JSON.stringify(state.settings[key].v)
        )
      } catch {
        // Le miroir est facultatif : la valeur est déjà en base.
      }
    }
    window.dispatchEvent(new Event(SETTINGS_SYNCED_EVENT))
  }
}

async function runOnce(): Promise<void> {
  console.debug("[sync] runOnce start")
  if (!(await ld.auth.loadSession())) {
    console.debug("[sync] no session")
    return
  }
  const account = ld.auth.getAccount()
  if (!account) {
    console.debug("[sync] no account")
    return
  }
  const accountId = String(account.id)
  const me = deviceId()
  console.debug("[sync] account:", accountId, "device:", me)

  const listing = await listSyncFolder()
  if (!listing) {
    console.debug("[sync] no listing")
    return
  }
  const groups = groupByDevice(listing.files)
  console.debug("[sync] device groups:", [...groups.keys()])

  // 1. Lire les autres appareils. Un fichier illisible est ignoré, jamais fatal.
  const peers: SyncDoc[] = []
  const stale = []
  for (const [id, nodes] of groups) {
    if (id === me) continue
    try {
      console.debug("[sync] reading peer", id)
      const text = await readText(nodes[0])
      const doc = parseDoc(decodeBase64(text))
      if (!doc) {
        console.debug("[sync] peer", id, "parse failed")
        continue
      }
      if (doc.deviceId !== id || doc.accountId !== accountId) {
        console.debug("[sync] peer", id, "mismatch (deviceId/accountId)")
        continue
      }
      if (Date.now() - doc.savedAt > STALE_MS) {
        console.debug("[sync] peer", id, "stale")
        stale.push(...nodes)
      } else {
        console.debug(
          "[sync] peer",
          id,
          "ok, rev:",
          doc.rev,
          "savedAt:",
          doc.savedAt
        )
        peers.push(doc)
      }
    } catch (e) {
      console.warn("[sync] peer", id, "read error:", e)
    }
  }

  // 2. Fusionner dans la base locale (une seule transaction).
  console.debug("[sync] merging", peers.length, "peer(s)")
  const { state, applied } = await mergeIntoLocal(peers)
  console.debug("[sync] applied:", applied)
  applyToUi(applied, state)

  // 3. Réécrire NOTRE fichier si l'état a changé depuis le dernier envoi.
  const own = groups.get(me) ?? []
  const print = fingerprint(state)
  const lastPrint = readStored(FINGERPRINT_KEY)
  console.debug(
    "[sync] fingerprint:",
    print,
    "last:",
    lastPrint,
    "own files:",
    own.length
  )
  if (print !== lastPrint || own.length === 0) {
    const rev = Number(readStored(REV_KEY) ?? 0) + 1
    const doc: SyncDoc = {
      v: DOC_VERSION,
      accountId,
      deviceId: me,
      rev,
      savedAt: Date.now(),
      ...state,
    }
    const folder = await ensureSyncFolder(listing)
    await writeText(
      encodeBase64(JSON.stringify(doc)),
      syncFileName(me),
      folder,
      own[0]
    )
    writeStored(FINGERPRINT_KEY, print)
    writeStored(REV_KEY, String(rev))
    console.debug("[sync] wrote own file rev", rev)
    // Doublons de NOTRE fichier uniquement : ceux des autres sont à eux.
    await removeNodes(own.slice(1)).catch(() => {})
  } else {
    console.debug("[sync] no local changes, skipping write")
  }

  // 4. Oublier les appareils muets depuis longtemps (leur état est déjà fondu
  // dans les fichiers des appareils actifs).
  await removeNodes(stale).catch(() => {})
  console.debug("[sync] runOnce done")
}

let running = false
let again = false

export async function syncNow(): Promise<void> {
  if (running) {
    console.debug("[sync] syncNow: already running, scheduling another pass")
    again = true
    return
  }
  console.debug("[sync] syncNow start")
  running = true
  setStatus({ ...status, state: "syncing" })
  try {
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      again = false
      console.debug("[sync] pass", pass + 1)
      await runOnce()
      if (!again) break
    }
    setStatus({ state: "idle", lastSync: Date.now() })
    console.debug("[sync] syncNow done")
  } catch (error) {
    // Hors ligne, pas de cloud sur ce compte, session expirée... : jamais
    // bloquant. L'app reste utilisable en local et on réessaiera.
    const message = error instanceof Error ? error.message : String(error)
    console.error("[sync] syncNow error:", message)
    setStatus({ state: "error", lastSync: status.lastSync, error: message })
  } finally {
    running = false
  }
}

// ---- Déclencheurs ---------------------------------------------------------------

// Démarre la synchronisation : un passage au lancement, un après chaque
// écriture locale (anti-rebond), un au retour du réseau.
export function startCloudSync(): () => void {
  console.debug("[sync] startCloudSync")
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = (delay: number) => {
    clearTimeout(timer)
    timer = setTimeout(() => void syncNow(), delay)
  }
  const offDirty = onDirty(() => {
    console.debug(
      "[sync] markDirty received, scheduling sync in",
      DEBOUNCE_MS,
      "ms"
    )
    schedule(DEBOUNCE_MS)
  })
  const onOnline = () => {
    console.debug("[sync] online event, scheduling immediate sync")
    schedule(0)
  }
  window.addEventListener("online", onOnline)
  schedule(2000)
  return () => {
    clearTimeout(timer)
    offDirty()
    window.removeEventListener("online", onOnline)
  }
}

// Au retour au premier plan (déjà espacé de 60 s par useForegroundRefresh).
export function requestSync(): void {
  console.debug("[sync] requestSync")
  void syncNow()
}
