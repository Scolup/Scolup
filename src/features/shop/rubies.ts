import { getDB } from "@/services/storage"
import { triggerCloudSync } from "@/services/cloudSync"

export const RUBIES_KEY = "rubies"
export const PENDING_KEY = "pending"
const LEGACY_KEY = "scolup.rubies"

let cache = 0
let pending = 0
let loaded = false
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0
}

// Ancienne version : le solde était dans localStorage. On le recopie en base une fois.
async function migrateLegacyBalance(
  db: Awaited<ReturnType<typeof getDB>>
): Promise<void> {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return
    const balance = Number.parseInt(legacy, 10)
    if (Number.isNaN(balance) || balance <= 0) return
    cache = balance
    await db.put("shop", cache, RUBIES_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Migration impossible : on la retentera au prochain démarrage.
  }
}

export async function loadRubies(): Promise<number> {
  if (loaded) return cache
  try {
    const db = await getDB()
    const [balance, pendingRaw] = await Promise.all([
      db.get("shop", RUBIES_KEY),
      db.get("shop", PENDING_KEY),
    ])
    pending = toCount(pendingRaw)
    if (typeof balance === "number" && !Number.isNaN(balance)) {
      cache = toCount(balance)
      loaded = true
      return cache
    }
    await migrateLegacyBalance(db)
  } catch {
    // Base inaccessible : on garde le solde en mémoire (0 au premier lancement).
  }
  loaded = true
  return cache
}

// Re-read the balance from IndexedDB (after a transaction wrote it directly).
export async function reloadRubies(): Promise<void> {
  loaded = false
  await loadRubies()
  notify()
}

export function getRubies(): number {
  return cache
}

export function getPendingRubies(): number {
  return pending
}

// Earned rewards wait in `pending` until the student claims them.
export async function claimRubies(): Promise<number> {
  try {
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const [balanceRaw, pendingRaw] = await Promise.all([
      store.get(RUBIES_KEY),
      store.get(PENDING_KEY),
    ])
    const amount = toCount(pendingRaw)
    if (amount > 0) {
      await store.put(toCount(balanceRaw) + amount, RUBIES_KEY)
      await store.put(0, PENDING_KEY)
    }
    await tx.done
    if (amount > 0) {
      await reloadRubies()
      triggerCloudSync()
    }
    return amount
  } catch {
    return 0
  }
}

export function subscribeRubies(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
