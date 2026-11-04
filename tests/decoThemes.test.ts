import { describe, expect, test } from "bun:test"
import { SHOP_ITEMS, type ThemeShopItem } from "@/features/shop/shopRules"
import { DECO_THEMES } from "@/features/shop/decoThemes"

describe("decoThemes", () => {
  test("every theme item in the catalog has a deco config", () => {
    const decoIds = Object.keys(DECO_THEMES)
    for (const item of SHOP_ITEMS.filter(
      (entry): entry is ThemeShopItem => entry.kind === "theme"
    )) {
      expect(decoIds).toContain(item.value)
    }
  })

  test("every deco theme is sold in the catalog", () => {
    const soldValues = SHOP_ITEMS.filter(
      (entry): entry is ThemeShopItem => entry.kind === "theme"
    ).map((entry) => entry.value)
    expect(soldValues.sort()).toEqual(Object.keys(DECO_THEMES).sort())
  })

  test("every deco theme has mascots, scatter and page stickers", () => {
    for (const def of Object.values(DECO_THEMES)) {
      expect(def.mascots.length).toBeGreaterThanOrEqual(1)
      expect(def.scatter.length).toBeGreaterThanOrEqual(1)
      expect(def.stickers.length).toBe(3)
    }
  })

  test("packs pair colors with exactly one theme", () => {
    for (const item of SHOP_ITEMS) {
      if (item.kind !== "bundle") continue
      const members = item.items
        .map((id) => SHOP_ITEMS.find((candidate) => candidate.id === id))
        .filter((member) => !!member)
      expect(
        members.filter((m) => m?.kind === "accent").length
      ).toBeGreaterThanOrEqual(1)
      expect(members.filter((m) => m?.kind === "theme").length).toBe(1)
    }
  })
})
