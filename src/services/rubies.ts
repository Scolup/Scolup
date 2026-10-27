import { getDB } from "./storage"

const RUBIES_KEY = "rubies"
const LEGACY_KEY = "scolup.rubies"

let cache = 0
let loaded = false
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export async function loadRubies(): Promise<number> {
  if (loaded) return cache
  try {
    const db = await getDB()
    const v = await db.get("shop", RUBIES_KEY)
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

export function getRubies(): number {
  return cache
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
  await setRubies(next)
  return next
}

export function subscribeRubies(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
