import { getDB } from "./storage"

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

export async function loadRubies(): Promise<number> {
  if (loaded) return cache
  try {
    const db = await getDB()
    const [v, p] = await Promise.all([
      db.get("shop", RUBIES_KEY),
      db.get("shop", PENDING_KEY),
    ])
    pending = toCount(p)
    if (typeof v === "number" && !Number.isNaN(v)) {
      cache = Math.max(0, Math.trunc(v))
      loaded = true
      return cache
    }
    try {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        const n = Number.parseInt(legacy, 10)
        if (!Number.isNaN(n) && n > 0) {
          cache = Math.max(0, Math.trunc(n))
          await db.put("shop", cache, RUBIES_KEY)
          localStorage.removeItem(LEGACY_KEY)
        }
      }
    } catch {}
  } catch {}
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
    if (amount > 0) await reloadRubies()
    return amount
  } catch {
    return 0
  }
}

export async function setRubies(count: number): Promise<void> {
  const n = Math.max(0, Math.trunc(count))
  cache = n
  try {
    const db = await getDB()
    await db.put("shop", cache, RUBIES_KEY)
  } catch {}
  notify()
}

export async function addRubies(amount: number): Promise<number> {
  await loadRubies()
  const next = cache + Math.trunc(amount)
  if (next < 0) {
    cache = 0
    try {
      const db = await getDB()
      await db.put("shop", 0, RUBIES_KEY)
    } catch {}
    notify()
    return 0
  }
  await setRubies(next)
  return next
}

export function subscribeRubies(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
