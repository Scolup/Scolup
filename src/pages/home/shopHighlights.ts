import { SHOP_ITEMS, type ShopItem } from "@/features/shop/shopRules"
import { layoutShop, type ShopEntry } from "@/pages/shop/shopLayout"

// Ownership is irrelevant here: the widget only promotes what the shop sells
// right now, so every entry starts unowned and affordable.
const ENTRIES: ShopEntry[] = SHOP_ITEMS.map((item) => ({
  item,
  owned: false,
  active: false,
  missing: 0,
}))

// A few items from the current shelves, without duplicates. `layoutShop`
// already drops pack-only items and closed limited editions.
export function pickShopHighlights(
  count: number,
  now = new Date(),
  random = Math.random
): ShopItem[] {
  const { collections, colors } = layoutShop(ENTRIES, now)
  const pool = [
    ...collections.flatMap((group) => group.entries),
    ...colors,
  ].map((entry) => entry.item)
  const picked: ShopItem[] = []
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }
  return picked
}
