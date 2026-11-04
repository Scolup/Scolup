import { getDB } from "@/services/storage"
import { markDirty } from "@/services/syncSignal"
import { balanceOf, claimAll, pendingOf } from "./wallet"
import { readWallet, writeWallet } from "./walletStore"

let cache = 0
let pending = 0
let loaded = false
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export async function loadRubies(): Promise<number> {
  if (loaded) return cache
  try {
    const db = await getDB()
    const wallet = await readWallet((key) => db.get("shop", key))
    // Deux appareils hors ligne ont pu dépenser les mêmes rubis : le solde
    // fusionné peut être négatif, on n'affiche jamais moins de 0.
    cache = Math.max(0, balanceOf(wallet))
    pending = pendingOf(wallet)
    loaded = true
  } catch {
    // Base inaccessible : on garde le solde en mémoire (0 au premier lancement).
  }
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

// Earned rewards wait as "pending" until the student claims them.
export async function claimRubies(): Promise<number> {
  try {
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const wallet = await readWallet((key) => store.get(key))
    const amount = pendingOf(wallet)
    console.debug("[rubies] claimRubies: pending =", amount)
    if (amount > 0) await writeWallet(store, claimAll(wallet))
    await tx.done
    if (amount > 0) {
      await reloadRubies()
      markDirty()
    }
    return amount
  } catch (e) {
    console.error("[rubies] claimRubies error:", e)
    return 0
  }
}

export function subscribeRubies(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
