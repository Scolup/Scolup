import { reloadRubies } from "./rubies"
import {
  findPromo,
  huntable,
  isLive,
  isNearMiss,
  openStep,
  promoId,
  rewardsOf,
  stepsOf,
  type PromoReward,
} from "./promoCodes"
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
import { balanceOf, coupon, earnNow, ownedOf, spend, weeksOf } from "./wallet"
import { buildVault, EMPTY_VAULT, type VaultState } from "./vault"
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

export async function loadVault(): Promise<VaultState> {
  try {
    const db = await getDB()
    const wallet = await readWallet((key) => db.get("shop", key))
    return buildVault(wallet, new Date())
  } catch {
    return EMPTY_VAULT
  }
}

export type RedeemStatus = "ok" | "invalid" | "used" | "error"

export interface RedeemResult {
  status: RedeemStatus
  reward?: PromoReward
  message?: string // la réplique de José pour ce code, quand il en a une
  near?: boolean // code inconnu, mais à une faute de frappe d'un vrai code
}

// « Tu chauffes » : le code tapé ressemble à un code encore à trouver.
async function isNearMissOfHidden(code: string): Promise<boolean> {
  try {
    const db = await getDB()
    const wallet = await readWallet((key) => db.get("shop", key))
    return isNearMiss(code, huntable(wallet, new Date()))
  } catch {
    return false
  }
}

// Redeem a code into the wallet: rubies are credited at once, a free item is
// marked owned, and a price code stores the capped price for its item. The
// wallet facts are idempotent, so a code can only be redeemed once — even
// across two devices.
export async function redeemCode(code: string): Promise<RedeemResult> {
  const promo = findPromo(code)
  if (!promo || !isLive(promo, new Date())) {
    return { status: "invalid", near: await isNearMissOfHidden(code) }
  }
  const valid = stepsOf(promo).every((step) =>
    rewardsOf(step.reward).every(
      (entry) =>
        entry.kind === "rubies" ||
        SHOP_ITEMS.some((item) => item.id === entry.itemId)
    )
  )
  if (!valid) return { status: "invalid" }
  try {
    const db = await getDB()
    const tx = db.transaction("shop", "readwrite")
    const store = tx.objectStore("shop")
    const wallet = await readWallet((key) => store.get(key))
    const open = openStep(wallet, promo)
    if (!open) {
      await tx.done
      return { status: "used", reward: promo.reward }
    }
    let next = wallet
    for (const entry of rewardsOf(open.step.reward)) {
      if (entry.kind === "rubies") {
        next = earnNow(
          next,
          promoId(promo, open.index),
          entry.amount,
          periodKey("weekly", new Date())
        )
      } else if (entry.kind === "free-item") {
        next = spend(next, entry.itemId, 0)
      } else {
        next = coupon(next, entry.itemId, entry.price)
      }
    }
    await writeWallet(store, next)
    await tx.done
    await reloadRubies()
    markDirty()
    void track("code-found", promo.code)
    return {
      status: "ok",
      reward: open.step.reward,
      message: open.step.message,
    }
  } catch {
    return { status: "error" }
  }
}
