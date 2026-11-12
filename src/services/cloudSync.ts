// Synchronisation entre appareils, sans serveur : uniquement le cloud
// EcoleDirecte de l'élève, via Litedirecte.
//
// Principe : chaque appareil écrit UN fichier à lui (`Scolup/sync-<id>.json`)
// qui contient son état complet, déjà fusionné avec ce qu'il connaît des
// autres. À chaque passage on lit les fichiers des autres, on fusionne (règles
// commutatives, voir features/sync/merge.ts), puis on réécrit le sien si
// quelque chose a changé. Personne n'écrase le fichier d'un autre, et les
// écritures simultanées se rattrapent d'elles-mêmes au passage suivant.

import { useSyncExternalStore } from "react"
import { EdNetworkError } from "litedirecte"
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
import type { SyncListing } from "./cloudTransport"
import { ld } from "./litedirecte"
import { mergeIntoLocal, type Applied } from "./syncState"
import { publishLearn } from "@/features/learn/learnStore"
import type { SyncState } from "@/features/sync/document"
import { onDirty } from "./syncSignal"

const DEVICE_KEY = "scolup-device-id" // propre à l'appareil : jamais synchronisé
const FINGERPRINT_KEY = "scolup-sync-fingerprint"
const REV_KEY = "scolup-sync-rev"
const STALE_MS = 60 * 24 * 3600 * 1000 // un appareil muet depuis 60 j est oublié
const DEBOUNCE_MS = 1500
const MAX_PASSES = 3
const STARTUP_RETRY_MS = 3000

function browserOffline(): boolean {
  try {
    return navigator.onLine === false
  } catch {
    return false
  }
}

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
  // "pending" tant que le premier passage n'a pas abouti : l'app reste sur le
  // splash. "done" dès qu'on peut afficher l'état local, synchronisé ou non.
  startup: "pending" | "done"
  // Cloud injoignable : la boutique et les quêtes restent fermées pour ne pas
  // afficher un état local qui n'a pas été fusionné.
  offline: boolean
}

let status: SyncStatus = {
  state: "idle",
  lastSync: null,
  startup: "pending",
  offline: browserOffline(),
}
const statusListeners = new Set<() => void>()

function updateStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  for (const listener of statusListeners) listener()
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function onSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(onSyncStatus, getSyncStatus, getSyncStatus)
}

// Repart pour un premier passage : l'app se remasque jusqu'au prochain
// résultat (lancement, retour d'onboarding, reconnexion).
export function beginStartupSync(): void {
  clearStartupRetry()
  updateStatus({ startup: "pending", offline: browserOffline() })
}

let startupRetry: ReturnType<typeof setTimeout> | undefined

function clearStartupRetry(): void {
  if (startupRetry === undefined) return
  clearTimeout(startupRetry)
  startupRetry = undefined
}

function scheduleStartupRetry(): void {
  if (startupRetry !== undefined) return
  startupRetry = setTimeout(() => {
    startupRetry = undefined
    void syncNow()
  }, STARTUP_RETRY_MS)
}

// Un échec réseau ou une session expirée ne permettent pas de fusionner le
// cloud : on ouvre l'app en mode dégradé plutôt que de rester bloqué.
function isOfflineFailure(error: unknown): boolean {
  if (browserOffline()) return true
  if (error instanceof EdNetworkError) return true
  try {
    return ld.sync.getState().state === "auth-required"
  } catch {
    return false
  }
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
  console.debug("[sync] device:", me)

  const listing = await listSyncFolder()
  if (!listing) {
    console.debug("[sync] no listing")
    return
  }
  const groups = groupByDevice(listing.files)
  console.debug("[sync] device groups:", [...groups.keys()])

  // 1. Lire les autres appareils. Un fichier illisible est ignoré, jamais fatal.
  const peers: SyncDoc[] = []
  const stale: SyncListing["files"] = []
  await Promise.all(
    [...groups].map(async ([id, nodes]) => {
      if (id === me) return
      try {
        console.debug("[sync] reading peer", id)
        const text = await readText(nodes[0])
        const doc = parseDoc(decodeBase64(text))
        if (!doc) {
          console.debug("[sync] peer", id, "parse failed")
          return
        }
        if (doc.deviceId !== id || doc.accountId !== accountId) {
          console.debug("[sync] peer", id, "mismatch (deviceId/accountId)")
          return
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
    })
  )

  // 2. Fusionner dans la base locale (une seule transaction).
  console.debug("[sync] merging", peers.length, "peer(s)")
  const { state, applied } = await mergeIntoLocal(peers, accountId)
  if (applied.learn) publishLearn(accountId, state.learn)
  console.debug("[sync] applied:", applied)
  applyToUi(applied, state)

  // 3. Réécrire NOTRE fichier si l'état a changé depuis le dernier envoi.
  const own = groups.get(me) ?? []
  const print = fingerprint(state)
  const lastPrint = readStored(FINGERPRINT_KEY)
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
  updateStatus({ state: "syncing", error: undefined })
  try {
    if (browserOffline()) {
      console.debug("[sync] offline, skipping")
      updateStatus({ state: "idle", startup: "done", offline: true })
      return
    }
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      again = false
      console.debug("[sync] pass", pass + 1)
      await runOnce()
      if (!again) break
    }
    clearStartupRetry()
    updateStatus({
      state: "idle",
      lastSync: Date.now(),
      startup: "done",
      offline: false,
    })
    console.debug("[sync] syncNow done")
  } catch (error) {
    // Hors ligne, cloud absent, session expirée... : l'app reste utilisable
    // en local. Un autre échec garde le splash et retente le premier passage.
    const message = error instanceof Error ? error.message : String(error)
    const offline = isOfflineFailure(error)
    console.error("[sync] syncNow error:", message)
    updateStatus({
      state: "error",
      error: message,
      offline: offline || status.offline,
      startup: offline ? "done" : status.startup,
    })
    if (!offline && status.startup === "pending") scheduleStartupRetry()
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
  // Dès la coupure, on ferme boutique et quêtes : leur état local n'est plus
  // garanti. Le prochain passage réussi les rouvrira.
  const onOffline = () => {
    console.debug("[sync] offline event")
    updateStatus({ offline: true })
  }
  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onOffline)
  // Immédiatement au lancement : le splash attend ce premier passage.
  schedule(0)
  return () => {
    clearTimeout(timer)
    clearStartupRetry()
    offDirty()
    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onOffline)
  }
}

// Au retour au premier plan (déjà espacé de 60 s par useForegroundRefresh).
export function requestSync(): void {
  console.debug("[sync] requestSync")
  void syncNow()
}
