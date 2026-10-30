import { reloadRubies, RUBIES_KEY } from "./rubies"
import { track } from "./quests"
import { getDB } from "./storage"
import {
  OWNED_KEY,
  parseOwned,
  parseWeeks,
  purchase,
  SHOP_ITEMS,
  WEEKS_KEY,
  type PurchaseStatus,
  type WeekStats,
} from "./shop-rules"

export interface ShopState {
  owned: string[]
  weeks: WeekStats
}

export const EMPTY_SHOP: ShopState = { owned: [], weeks: {} }

// ponytail: "xp" used to hold lifetime rubies for the removed level system.
// Real XP is coming: delete the stale value once so nobody mistakes it for the
// new one. Remove this after a few releases.
let staleXpDropped = false

export async function loadShop(): Promise<ShopState> {
  try {
    const db = await getDB()
    if (!staleXpDropped) {
      staleXpDropped = true
      await db.delete("shop", "xp")
    }
    const [ownedRaw, weeksRaw] = await Promise.all([
      db.get("shop", OWNED_KEY),
      db.get("shop", WEEKS_KEY),
    ])
    return {
      owned: parseOwned(ownedRaw),
      weeks: parseWeeks(weeksRaw),
    }
  } catch {
    return EMPTY_SHOP
  }
}

// Balance and inventory change in ONE transaction: no ruby is ever spent
// without the item being saved, and the other way around.
export async function buyItem(
  id: string
): Promise<PurchaseStatus | "unknown" | "error"> {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id)
  if (!item) return "unknown"
  try {
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const [balanceRaw, ownedRaw] = await Promise.all([
      store.get(RUBIES_KEY),
      store.get(OWNED_KEY),
    ])
    const balance = typeof balanceRaw === "number" ? balanceRaw : 0
    const result = purchase(item, balance, parseOwned(ownedRaw))
    if (result.status === "ok") {
      await store.put(result.balance, RUBIES_KEY)
      await store.put(JSON.stringify(result.owned), OWNED_KEY)
    }
    await tx.done
    if (result.status === "ok") {
      await reloadRubies()
      void track("purchase", item.id)
    }
    return result.status
  } catch {
    return "error"
  }
}
