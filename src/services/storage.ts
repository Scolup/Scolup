import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Wallet } from "@/features/shop/wallet"
import { isSyncedSetting } from "@/features/sync/keys"
import { markDirty } from "./syncSignal"

export interface SubjectRecord {
  id: string
  code?: string
  name: string
  customName?: string
  customColor?: string
  coef?: number
  updatedAt?: number // ms, posé à chaque personnalisation : sert à la synchronisation
}

interface ScolupDB extends DBSchema {
  settings: {
    key: string
    value: string | boolean
  }
  subjects: {
    key: string
    value: SubjectRecord
  }
  // "wallet" holds the Wallet (see features/shop/wallet.ts). The old keys
  // "rubies", "pending", "owned", "weekly" are only read once, to migrate.
  shop: {
    key: string
    value: Wallet | number | string
  }
  quests: {
    key: string
    value: string
  }
  // Horodatage (ms) de chaque réglage synchronisé, clé "s:<réglage>".
  meta: {
    key: string
    value: number
  }
}

let dbInstance: IDBPDatabase<ScolupDB> | null = null

export async function getDB(): Promise<IDBPDatabase<ScolupDB>> {
  if (!dbInstance) {
    dbInstance = await openDB<ScolupDB>("scolup", 6, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) db.createObjectStore("settings")
        else if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings")
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains("subjects")) {
          db.createObjectStore("subjects")
        }
        if (oldVersion < 4 && !db.objectStoreNames.contains("shop")) {
          db.createObjectStore("shop")
        }
        if (oldVersion < 5 && !db.objectStoreNames.contains("quests")) {
          db.createObjectStore("quests")
        }
        if (oldVersion < 6 && !db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta")
        }
      },
    })
  }
  return dbInstance
}

export async function setSetting(
  key: string,
  value: string | boolean
): Promise<void> {
  try {
    localStorage.setItem(`scolup:${key}`, JSON.stringify(value))
  } catch {
    // Le miroir localStorage est facultatif : la valeur est aussi écrite en base juste après.
  }
  const db = await getDB()
  if (!isSyncedSetting(key)) {
    await db.put("settings", value, key)
    return
  }
  const tx = db.transaction(["settings", "meta"], "readwrite")
  await Promise.all([
    tx.objectStore("settings").put(value, key),
    tx.objectStore("meta").put(Date.now(), `s:${key}`),
    tx.done,
  ])
  markDirty()
}

export async function getSetting(
  key: string
): Promise<string | boolean | undefined> {
  const db = await getDB()
  return db.get("settings", key)
}

export function getSettingSync(key: string): string | boolean | undefined {
  try {
    const raw = localStorage.getItem(`scolup:${key}`)
    if (raw === null) return undefined
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === "string" || typeof parsed === "boolean"
      ? parsed
      : undefined
  } catch {
    return undefined
  }
}

export async function readLastSeen(key: string): Promise<number> {
  const stored = await getSetting(`seen:${key}`)
  const parsed = typeof stored === "string" ? Number(stored) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

export async function markSeen(key: string): Promise<void> {
  await setSetting(`seen:${key}`, String(Date.now()))
}

// Wipes every trace of Scolup preferences from the device. The user stays
// logged in (the session is Litedirecte's), so only a reload is needed.
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await Promise.all([
    db.clear("settings"),
    db.clear("subjects"),
    db.clear("meta"),
  ])
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("scolup:")) localStorage.removeItem(key)
    }
  } catch {
    // localStorage indisponible : il n'y a rien à effacer.
  }
}
