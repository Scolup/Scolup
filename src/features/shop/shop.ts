import { reloadRubies } from "./rubies"
import { findPromo, type PromoReward } from "./promoCodes"
import { track } from "@/features/quests/service"
import { periodKey } from "@/features/quests/period"
import { getDB } from "@/services/storage"
import { markDirty } from "@/services/syncSignal"
import {
  purchase,
  SHOP_ITEMS,
  withSale,
  type PurchaseStatus,
  type WeekStats,
} from "./shopRules"
import {
  balanceOf,
  coupon,
  earnNow,
  hasEarned,
  ownedOf,
  spend,
  weeksOf,
} from "./wallet"
import { readWallet, writeWallet } from "./walletStore"

export interface ShopState {
  owned: string[]
  weeks: WeekStats
  coupons: Record<string, number>
}

export const EMPTY_SHOP: ShopState = { owned: [], weeks: {}, coupons: {} }

export async function loadShop(): Promise<ShopState> {
  try {
    const db = await getDB()
    const wallet = await readWallet((key) => db.get("shop", key))
    return {
      owned: ownedOf(wallet),
      weeks: weeksOf(wallet),
      coupons: wallet.coupons,
    }
  } catch {
    return EMPTY_SHOP
  }
}

// The purchase is ONE fact in the wallet (item id -> price paid): no ruby is
// ever spent without the item being owned, and the other way around. It merges
// with other devices by union, so a purchase can never be undone by a sync.
// A redeemed price code is already in the wallet: it caps the price charged.
export async function buyItem(
  id: string
): Promise<PurchaseStatus | "unknown" | "error"> {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id)
  if (!item) return "unknown"
  try {
    const onSale = withSale(item, new Date())
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const wallet = await readWallet((key) => store.get(key))
    const couponPrice = wallet.coupons[item.id]
    const pricedItem =
      couponPrice === undefined
        ? onSale
        : {
            ...onSale,
            price: Math.min(onSale.price, couponPrice),
            originalPrice: onSale.originalPrice ?? onSale.price,
          }
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

// ---- Codes promo ----------------------------------------------------------

export type RedeemStatus = "ok" | "invalid" | "used" | "error"

export interface RedeemResult {
  status: RedeemStatus
  reward?: PromoReward
}

// Redeem a code into the wallet: rubies are credited at once, a free item is
// marked owned, and a price code stores the capped price for its item. The
// wallet facts are idempotent, so a code can only be redeemed once — even
// across two devices.
export async function redeemCode(code: string): Promise<RedeemResult> {
  const promo = findPromo(code)
  if (!promo) return { status: "invalid" }
  const reward = promo.reward
  if (
    reward.kind !== "rubies" &&
    !SHOP_ITEMS.some((item) => item.id === reward.itemId)
  ) {
    return { status: "invalid" }
  }
  try {
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const wallet = await readWallet((key) => store.get(key))
    const id = `promo:${promo.code}`
    const already =
      reward.kind === "rubies"
        ? hasEarned(wallet, id)
        : reward.kind === "free-item"
          ? reward.itemId in wallet.spent
          : reward.itemId in wallet.coupons
    if (already) {
      await tx.done
      return { status: "used", reward }
    }
    const next =
      reward.kind === "rubies"
        ? earnNow(wallet, id, reward.amount, periodKey("weekly", new Date()))
        : reward.kind === "free-item"
          ? spend(wallet, reward.itemId, 0)
          : coupon(wallet, reward.itemId, reward.price)
    await writeWallet(store, next)
    await tx.done
    await reloadRubies()
    markDirty()
    return { status: "ok", reward }
  } catch {
    return { status: "error" }
  }
}
