import { openDB, type DBSchema } from "idb"
import type { SyncState } from "@/features/sync/document"
import { applySyncStateToUi } from "./cloudSync"
import { mergeIntoLocal } from "./syncState"

interface ProfilesDB extends DBSchema {
  profiles: { key: string; value: SyncState }
}

function openProfiles() {
  return openDB<ProfilesDB>("scolup-pronote", 1, {
    upgrade: (db) => db.createObjectStore("profiles"),
  })
}

export async function storePronoteProfile(account: string) {
  const { state } = await mergeIntoLocal([])
  const db = await openProfiles()
  try {
    await db.put("profiles", state, account)
  } finally {
    db.close()
  }
}

export async function restorePronoteProfile(account: string): Promise<boolean> {
  const db = await openProfiles()
  try {
    const snapshot = await db.get("profiles", account)
    if (!snapshot) return false
    const { state, applied } = await mergeIntoLocal([snapshot])
    applySyncStateToUi(applied, state)
    return true
  } finally {
    db.close()
  }
}
