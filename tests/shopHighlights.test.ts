import { describe, expect, test } from "bun:test"
import { pickShopHighlights } from "@/pages/home/shopHighlights"

const NOV_4 = new Date("2026-11-04T12:00:00")

describe("pickShopHighlights", () => {
  test("picks distinct available items", () => {
    const items = pickShopHighlights(3, NOV_4, () => 0)
    expect(items).toHaveLength(3)
    expect(new Set(items.map((item) => item.id)).size).toBe(3)
    expect(items.every((item) => !item.packOnly)).toBe(true)
  })

  test("never returns more items than the shelves hold", () => {
    const items = pickShopHighlights(999, NOV_4, () => 0)
    expect(items.length).toBeGreaterThan(3)
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
  })
})
