import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export interface SubjectRecord {
  id: string
  code?: string
  name: string
  customName?: string
  customColor?: string
  coef?: number
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
  shop: {
    key: string
    value: number
  }
}

let dbInstance: IDBPDatabase<ScolupDB> | null = null

export async function getDB(): Promise<IDBPDatabase<ScolupDB>> {
  if (!dbInstance) {
    dbInstance = await openDB<ScolupDB>("scolup", 4, {
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
  } catch {}
  const db = await getDB()
  await db.put("settings", value, key)
}

export async function getSetting(
  key: string
): Promise<string | boolean | undefined> {
  const db = await getDB()
  return db.get("settings", key)
}

export async function delSetting(key: string): Promise<void> {
  try {
    localStorage.removeItem(`scolup:${key}`)
  } catch {}
  const db = await getDB()
  await db.delete("settings", key)
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
  await Promise.all([db.clear("settings"), db.clear("subjects")])
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("scolup:")) localStorage.removeItem(key)
    }
  } catch {}
}
