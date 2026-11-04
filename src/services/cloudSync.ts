// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { getDB } from "./storage"
import { ld } from "./litedirecte"
import { reloadRubies } from "@/features/shop/rubies"
import { refreshQuests } from "@/features/quests/service"

export interface SyncPayload {
  version: number
  timestamp: number
  settings: Record<string, unknown>
  subjects: Record<string, unknown>
  shop: {
    rubies: number
    pending: number
    owned: string[]
    weeks: Record<string, unknown>
  }
  quests: {
    progress: Record<string, unknown>
    ledger: Record<string, unknown>
  }
  localStorageState: Record<string, string>
}

const SYNC_FILENAME = "scolup-sync.json"
const SYNC_FOLDER = "Scolup"
let syncInProgress = false

export async function collectLocalState(): Promise<SyncPayload> {
  const db = await getDB()
  const [settingsEntries, subjectsEntries, shopEntries, questsEntries] = await Promise.all([
    db.getAll("settings"),
    db.getAll("subjects"),
    db.getAll("shop"),
    db.getAll("quests"),
  ])
  const settingsKeys = await db.getAllKeys("settings")
  const subjectsKeys = await db.getAllKeys("subjects")
  const shopKeys = await db.getAllKeys("shop")
  const questsKeys = await db.getAllKeys("quests")

  const settings: Record<string, unknown> = {}
  settingsKeys.forEach((k, i) => {
    settings[String(k)] = settingsEntries[i]
  })

  const subjects: Record<string, unknown> = {}
  subjectsKeys.forEach((k, i) => {
    subjects[String(k)] = subjectsEntries[i]
  })

  const shop: any = { rubies: 0, pending: 0, owned: [], weeks: {} }
  shopKeys.forEach((k, i) => {
    const val = shopEntries[i]
    if (k === "rubies") shop.rubies = typeof val === "number" ? val : 0
    else if (k === "pending") shop.pending = typeof val === "number" ? val : 0
    else if (k === "owned") {
      try {
        shop.owned = typeof val === "string" ? JSON.parse(val) : Array.isArray(val) ? val : []
      } catch {
        shop.owned = []
      }
    } else if (k === "weeks") {
      try {
        shop.weeks = typeof val === "string" ? JSON.parse(val) : val || {}
      } catch {
        shop.weeks = {}
      }
    }
  })

  const quests: any = { progress: {}, ledger: {} }
  questsKeys.forEach((k, i) => {
    const val = questsEntries[i]
    if (k === "progress" || k === "ledger") {
      try {
        quests[k] = typeof val === "string" ? JSON.parse(val) : val || {}
      } catch {
        quests[k] = {}
      }
    }
  })

  const localStorageState: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("scolup:")) {
        const val = localStorage.getItem(key)
        if (val !== null) localStorageState[key] = val
      }
    }
  } catch {
    // ignore
  }

  const localTsKey = "scolup:sync_timestamp"
  const existingTs = Number(localStorage.getItem(localTsKey) || "0")
  const timestamp = Math.max(existingTs, Date.now())

  return {
    version: 1,
    timestamp,
    settings,
    subjects,
    shop,
    quests,
    localStorageState,
  }
}

export async function applyRemoteState(remote: SyncPayload): Promise<void> {
  if (!remote || typeof remote !== "object") return
  const db = await getDB()
  const tx = db.transaction(["settings", "subjects", "shop", "quests"], "readwrite")

  // Merge settings
  if (remote.settings && typeof remote.settings === "object") {
    const store = tx.objectStore("settings")
    for (const [k, v] of Object.entries(remote.settings)) {
      await store.put(v as any, k)
    }
  }

  // Merge subjects
  if (remote.subjects && typeof remote.subjects === "object") {
    const store = tx.objectStore("subjects")
    for (const [k, v] of Object.entries(remote.subjects)) {
      await store.put(v as any, k)
    }
  }

  // Merge shop
  if (remote.shop) {
    const store = tx.objectStore("shop")
    const localRubies = (await store.get("rubies")) || 0
    const localPending = (await store.get("pending")) || 0
    const localOwnedRaw = await store.get("owned")
    const localWeeksRaw = await store.get("weeks")

    let localOwned: string[] = []
    try {
      localOwned = typeof localOwnedRaw === "string" ? JSON.parse(localOwnedRaw) : Array.isArray(localOwnedRaw) ? localOwnedRaw : []
    } catch {}

    const remoteOwned = Array.isArray(remote.shop.owned) ? remote.shop.owned : []
    const mergedOwned = Array.from(new Set([...localOwned, ...remoteOwned]))

    await store.put(Math.max(Number(localRubies) || 0, Number(remote.shop.rubies) || 0), "rubies")
    await store.put(Math.max(Number(localPending) || 0, Number(remote.shop.pending) || 0), "pending")
    await store.put(JSON.stringify(mergedOwned), "owned")

    if (remote.shop.weeks && typeof remote.shop.weeks === "object") {
      let localWeeks: Record<string, any> = {}
      try {
        localWeeks = typeof localWeeksRaw === "string" ? JSON.parse(localWeeksRaw) : localWeeksRaw || {}
      } catch {}
      const mergedWeeks = { ...remote.shop.weeks, ...localWeeks }
      await store.put(JSON.stringify(mergedWeeks), "weeks")
    }
  }

  // Merge quests
  if (remote.quests) {
    const store = tx.objectStore("quests")
    if (remote.quests.progress) {
      const localProgRaw = await store.get("progress")
      let localProg: Record<string, any> = {}
      try {
        localProg = typeof localProgRaw === "string" ? JSON.parse(localProgRaw) : localProgRaw || {}
      } catch {}
      const mergedProg = { ...remote.quests.progress, ...localProg }
      await store.put(JSON.stringify(mergedProg), "progress")
    }
    if (remote.quests.ledger) {
      const localLedgerRaw = await store.get("ledger")
      let localLedger: Record<string, any> = {}
      try {
        localLedger = typeof localLedgerRaw === "string" ? JSON.parse(localLedgerRaw) : localLedgerRaw || {}
      } catch {}
      const mergedLedger = { ...remote.quests.ledger, ...localLedger }
      await store.put(JSON.stringify(mergedLedger), "ledger")
    }
  }

  await tx.done

  // Merge localStorage state
  if (remote.localStorageState && typeof remote.localStorageState === "object") {
    try {
      for (const [k, v] of Object.entries(remote.localStorageState)) {
        if (typeof v === "string") {
          localStorage.setItem(k, v)
        }
      }
    } catch {}
  }

  if (remote.timestamp) {
    localStorage.setItem("scolup:sync_timestamp", String(remote.timestamp))
  }

  await reloadRubies()
  refreshQuests()
}

export async function syncCloud(): Promise<void> {
  if (syncInProgress) return
  syncInProgress = true
  try {
    const cloudTree = await ld.cloud.getCloud({ depth: 2 }).catch(() => null)
    if (!cloudTree || !Array.isArray(cloudTree)) {
      syncInProgress = false
      return
    }

    let syncFile: any = null
    let scolupFolder: any = null

    for (const item of cloudTree) {
      if (item.type === "file" && item.libelle === SYNC_FILENAME) {
        syncFile = item
      } else if (item.type === "folder" && item.libelle === SYNC_FOLDER) {
        scolupFolder = item
        if (item.children && Array.isArray(item.children)) {
          for (const child of item.children) {
            if (child.type === "file" && child.libelle === SYNC_FILENAME) {
              syncFile = child
            }
          }
        }
      }
    }

    const localPayload = await collectLocalState()

    if (syncFile) {
      try {
        const blob = (await ld.downloads.download({
          params: { id: syncFile.id },
          as: "blob",
        })) as Blob
        const text = await blob.text()
        const remotePayload = JSON.parse(text) as SyncPayload

        const localTs = Number(localPayload.timestamp || 0)
        const remoteTs = Number(remotePayload.timestamp || 0)

        if (remoteTs > localTs) {
          await applyRemoteState(remotePayload)
        } else if (localTs > remoteTs) {
          localPayload.timestamp = localTs
          await ld.cloud.updateTextFile(JSON.stringify(localPayload), syncFile)
        }
      } catch {
        await ld.cloud.updateTextFile(JSON.stringify(localPayload), syncFile)
      }
    } else {
      let targetFolder = scolupFolder
      if (!targetFolder) {
        try {
          targetFolder = await ld.cloud.createFolder(SYNC_FOLDER, cloudTree[0] as any)
        } catch {
          // fallback
        }
      }
      if (targetFolder) {
        await ld.cloud.createTextFile(JSON.stringify(localPayload), SYNC_FILENAME, targetFolder)
      }
    }
  } catch {
    // Non-blocking
  } finally {
    syncInProgress = false
  }
}

let syncTimeout: any = null
export function triggerCloudSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    localStorage.setItem("scolup:sync_timestamp", String(Date.now()))
    void syncCloud()
  }, 1500)
}
