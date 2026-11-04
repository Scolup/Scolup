// The previous app kept everything on this device, in a format with no sync
// timestamps. Merging that data into the cloud would make old local values win
// or lose arbitrarily, so it is dropped once, before anything reads it.

import { getDB } from "./storage"

const VERSION_KEY = "idbversion"
const VERSION = "1"

function isCurrent(): boolean {
  try {
    return localStorage.getItem(VERSION_KEY) === VERSION
  } catch {
    return true // No localStorage: there is nothing to reset.
  }
}

async function resetLocalData(): Promise<void> {
  try {
    const db = await getDB()
    const stores = Array.from(db.objectStoreNames)
    if (stores.length > 0) {
      const tx = db.transaction(stores, "readwrite")
      await Promise.all([
        ...stores.map((name) => tx.objectStore(name).clear()),
        tx.done,
      ])
    }
  } catch {
    // Database inaccessible: nothing will be read from it either.
  }
  try {
    // Only Scolup keys: on a shared origin (localhost), localStorage.clear()
    // would wipe unrelated projects too.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("scolup")) localStorage.removeItem(key)
    }
    localStorage.setItem(VERSION_KEY, VERSION)
  } catch {
    // Without localStorage the marker cannot be written; the database is
    // already empty, so retrying next launch is harmless.
  }
}

if (!isCurrent()) await resetLocalData()
