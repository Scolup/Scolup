import { reloadRubies } from "./rubies"
import { promoPrice } from "./promoCodes"
import { track } from "@/features/quests/service"
import { getDB } from "@/services/storage"
import { markDirty } from "@/services/syncSignal"
import {
  purchase,
  SHOP_ITEMS,
  type PurchaseStatus,
  type WeekStats,
} from "./shopRules"
import { balanceOf, ownedOf, spend, weeksOf } from "./wallet"
import { readWallet, writeWallet } from "./walletStore"

export interface ShopState {
  owned: string[]
  weeks: WeekStats
}

export const EMPTY_SHOP: ShopState = { owned: [], weeks: {} }

export async function loadShop(): Promise<ShopState> {
  try {
    const db = await getDB()
    const wallet = await readWallet((key) => db.get("shop", key))
    return { owned: ownedOf(wallet), weeks: weeksOf(wallet) }
  } catch {
    return EMPTY_SHOP
  }
}

// The purchase is ONE fact in the wallet (item id -> price paid): no ruby is
// ever spent without the item being owned, and the other way around. It merges
// with other devices by union, so a purchase can never be undone by a sync.
export async function buyItem(
  id: string,
  code = ""
): Promise<PurchaseStatus | "unknown" | "error" | "invalid-promo"> {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id)
  if (!item) return "unknown"
  try {
    const discount = code ? promoPrice(item.id, code) : null
    if (code && discount === null) return "invalid-promo"
    const pricedItem = {
      ...item,
      price: Math.min(item.price, discount ?? item.price),
    }
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const wallet = await readWallet((key) => store.get(key))
    const result = purchase(pricedItem, balanceOf(wallet), ownedOf(wallet))
    if (result.status === "ok") {
      await writeWallet(store, spend(wallet, item.id, pricedItem.price))
    }
    await tx.done
    if (result.status === "ok") {
      await reloadRubies()
      void track("purchase", item.id)
      markDirty()
    }
    return result.status
  } catch {
    return "error"
  }
}
