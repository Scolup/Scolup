import { describe, expect, test } from "bun:test"
import {
  discountPercent,
  itemActive,
  itemOwned,
  purchase,
  SHOP_ITEMS,
} from "@/features/shop/shopRules"
import {
  COLLECTIONS,
  countdownLabel,
  layoutShop,
  type ShopEntry,
} from "@/pages/shop/shopLayout"
import type { BundleShopItem, ShopItem } from "@/features/shop/shopRules"

function entry(id: string, owned = false): ShopEntry {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id)
  if (!item) throw new Error(`unknown catalog item ${id}`)
  return { item, owned, active: false, missing: 0 }
}

describe("layoutShop", () => {
  test("every catalog collection is listed in COLLECTIONS", () => {
    for (const item of SHOP_ITEMS) {
      if (item.collection) {
        expect(Object.keys(COLLECTIONS)).toContain(item.collection)
      }
    }
  })

  test("collection items are pulled out in the order given", () => {
    const { collections, colors } = layoutShop([
      entry("accent-violet"),
      entry("accent-fantome"),
      entry("accent-orange"),
      entry("accent-sorciere"),
    ])

    expect(collections.length).toBe(1)
    expect(collections[0]?.label).toBe("Exclusivité Halloween")
    expect(collections[0]?.entries.map((e) => e.item.id)).toEqual([
      "accent-fantome",
      "accent-orange",
      "accent-sorciere",
    ])
    expect(colors.map((e) => e.item.id)).toEqual(["accent-violet"])
  })

  test("packs float to the top of the permanent section", () => {
    const { colors } = layoutShop([
      entry("accent-violet"),
      entry("theme-sport"),
      entry("pack-gamer"),
      entry("pack-etudiant"),
    ])

    expect(colors.map((e) => e.item.id)).toEqual([
      "pack-gamer",
      "pack-etudiant",
      "accent-violet",
      "theme-sport",
    ])
  })

  test("noel preview runs first, then halloween", () => {
    const { collections } = layoutShop(
      [
        "accent-houx",
        "accent-sapin",
        "accent-neige",
        "accent-orange",
        "accent-sorciere",
        "accent-fantome",
      ].map((id) => entry(id))
    )
    expect(collections.map((group) => group.id)).toEqual(["noel", "halloween"])
    expect(collections[0]?.entries.map((e) => e.item.id)).toEqual([
      "accent-houx",
      "accent-sapin",
      "accent-neige",
    ])
    expect(collections[1]?.entries.map((e) => e.item.id)).toEqual([
      "accent-orange",
      "accent-sorciere",
      "accent-fantome",
    ])
  })

  test("permanent colors keep the order given", () => {
    const { colors } = layoutShop(
      [
        "accent-violet",
        "accent-teal",
        "accent-cobalt",
        "accent-pink",
        "accent-aurore",
        "accent-or",
      ].map((id) => entry(id))
    )
    expect(colors.map((e) => e.item.id)).toEqual([
      "accent-violet",
      "accent-teal",
      "accent-cobalt",
      "accent-pink",
      "accent-aurore",
      "accent-or",
    ])
  })

  test("kept purchases of colors removed from the fall into the permanent section", () => {
    const ghost: ShopItem = {
      ...SHOP_ITEMS[0],
      id: "accent-retire",
      collection: "ete-certificat-perdu",
    }
    const { collections, colors } = layoutShop([
      { item: ghost, owned: true, active: false, missing: 0 },
      entry("accent-violet"),
    ])
    expect(collections.length).toBe(0)
    expect(colors.map((e) => e.item.id)).toEqual([ghost.id, "accent-violet"])
  })

  test("the pack leads the halloween collection while the sale runs", () => {
    const { collections, colors } = layoutShop(
      [
        entry("pack-halloween-2026"),
        entry("accent-orange"),
        entry("accent-sorciere"),
        entry("accent-fantome"),
        entry("theme-halloween2026"),
      ],
      new Date("2026-11-05T10:00:00")
    )
    expect(collections.length).toBe(1)
    expect(collections[0]?.id).toBe("halloween")
    expect(collections[0]?.entries.map((e) => e.item.id)).toEqual([
      "pack-halloween-2026",
      "accent-orange",
      "accent-sorciere",
      "accent-fantome",
    ])
    expect(colors).toEqual([])
  })

  test("a pack-only theme never gets a card", () => {
    const { collections, colors } = layoutShop(
      [entry("theme-halloween2026")],
      new Date("2026-11-05T10:00:00")
    )
    expect(collections.length).toBe(0)
    expect(colors).toEqual([])
  })

  test("a tick after the deadline the collection vanishes, kept purchases stay", () => {
    const kept = entry("accent-orange")
    kept.owned = true
    const { collections, colors } = layoutShop(
      [kept, entry("accent-sorciere"), entry("pack-halloween-2026")],
      new Date("2026-11-09T10:00:00")
    )
    expect(collections.length).toBe(0)
    expect(colors.map((e) => e.item.id)).toEqual(["accent-orange"])
  })
})

describe("countdownLabel", () => {
  const end = new Date("2026-11-09T09:00:00")

  test("days and hours while far out", () => {
    expect(countdownLabel(new Date("2026-11-03T10:00:00"), end)).toBe(
      "5 j 23 h"
    )
  })

  test("hours and minutes on the last day", () => {
    expect(countdownLabel(new Date("2026-11-09T06:00:00"), end)).toBe("3 h")
    expect(countdownLabel(new Date("2026-11-09T06:10:00"), end)).toBe(
      "2 h 50 min"
    )
  })

  test("minutes at the very end", () => {
    expect(countdownLabel(new Date("2026-11-09T08:30:00"), end)).toBe("30 min")
  })

  test("empty once the deadline passed", () => {
    expect(countdownLabel(new Date("2026-11-09T10:00:00"), end)).toBe("")
  })
})

describe("discountPercent", () => {
  test("no original price means no discount", () => {
    expect(discountPercent(150, undefined)).toBeNull()
  })

  test("a price above the original is not a discount", () => {
    expect(discountPercent(300, 250)).toBeNull()
    expect(discountPercent(250, 250)).toBeNull()
  })

  test("the discount is a rounded whole percent", () => {
    expect(discountPercent(100, 150)).toBe(33)
    expect(discountPercent(200, 300)).toBe(33)
    expect(discountPercent(175, 250)).toBe(30)
    expect(discountPercent(200, 250)).toBe(20)
  })
})

function pack(): BundleShopItem {
  const found = SHOP_ITEMS.find((item) => item.id === "pack-noel")
  if (!found || found.kind !== "bundle")
    throw new Error("pack-noel missing in the catalog")
  return found
}

describe("bundles", () => {
  test("buying a pack grants every member at the pack price", () => {
    const result = purchase(pack(), 500, [])
    expect(result.status).toBe("ok")
    expect(result.balance).toBe(50)
    expect(result.owned).toContain("accent-houx")
    expect(result.owned).toContain("theme-noel")
    // The pack id itself is never written: members are the source of truth.
    expect(result.owned).not.toContain("pack-noel")
  })

  test("a pack too expensive for the balance is refused", () => {
    const result = purchase(pack(), 100, [])
    expect(result.status).toBe("poor")
    expect(result.owned).toEqual([])
  })

  test("a fully-owned pack is not charged again", () => {
    const result = purchase(pack(), 500, ["accent-houx", "theme-noel"])
    expect(result.status).toBe("owned")
    expect(result.balance).toBe(500)
  })

  test("a partially-owned pack charges the pack price for the rest", () => {
    const result = purchase(pack(), 500, ["accent-houx"])
    expect(result.status).toBe("ok")
    expect(result.balance).toBe(50)
    expect(result.owned).toContain("theme-noel")
  })

  test("a pack is owned once every member is owned", () => {
    expect(itemOwned(pack(), [])).toBe(false)
    expect(itemOwned(pack(), ["accent-houx"])).toBe(false)
    expect(itemOwned(pack(), ["accent-houx", "theme-noel"])).toBe(true)
  })

  test("a pack is active when all its members are active at once", () => {
    const item = pack()
    const on = itemActive(item, "houx", "noel")
    expect(on).toBe(true)
    expect(itemActive(item, "blue", "noel")).toBe(false)
    expect(itemActive(item, "houx", "")).toBe(false)
  })

  test("a multi-color pack is active when its theme and one of its colors are", () => {
    const found = SHOP_ITEMS.find((item) => item.id === "pack-halloween-2026")
    if (!found || found.kind !== "bundle")
      throw new Error("pack-halloween-2026 missing in the catalog")
    expect(itemActive(found, "orange", "halloween2026")).toBe(true)
    expect(itemActive(found, "sorciere", "halloween2026")).toBe(true)
    expect(itemActive(found, "teal", "halloween2026")).toBe(false)
    expect(itemActive(found, "orange", "")).toBe(false)
  })
})
