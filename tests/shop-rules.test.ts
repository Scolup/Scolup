import { describe, expect, test } from "bun:test"
import {
  addToWeek,
  parseOwned,
  purchase,
  SHOP_ITEMS,
  weekMessage,
  weekSummary,
} from "../src/services/shop-rules"

const item = SHOP_ITEMS[0]

describe("purchase", () => {
  test("spends rubies and records the item", () => {
    const r = purchase(item, item.price + 10, [])
    expect(r).toEqual({ status: "ok", balance: 10, owned: [item.id] })
  })
  test("refuses when too poor", () => {
    expect(purchase(item, item.price - 1, []).status).toBe("poor")
  })
  test("never charges twice", () => {
    const r = purchase(item, 999, [item.id])
    expect(r).toEqual({ status: "owned", balance: 999, owned: [item.id] })
  })
  test("ids and prices are sane", () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length)
    expect(SHOP_ITEMS.every((i) => i.price > 0)).toBe(true)
  })
  test("parseOwned survives garbage", () => {
    expect(parseOwned("nope")).toEqual([])
    expect(parseOwned('["a",3]')).toEqual(["a"])
  })
})

describe("weekly recap", () => {
  test("adds and prunes old weeks", () => {
    let stats = {}
    for (let i = 1; i <= 15; i++) {
      stats = addToWeek(stats, `2026-01-${String(i).padStart(2, "0")}`, 1)
    }
    expect(Object.keys(stats)).toHaveLength(12)
  })
  test("messages are always kind", () => {
    const s = (thisWeek: number, lastWeek: number, best: number) => ({
      thisWeek,
      lastWeek,
      best,
    })
    expect(weekMessage(s(0, 50, 80))).toBeNull()
    expect(weekMessage(s(30, 50, 80))).toBe("+30 rubis cette semaine")
    expect(weekMessage(s(60, 50, 80))).toBe(
      "+60 cette semaine : tu fais mieux que la semaine dernière"
    )
    expect(weekMessage(s(90, 50, 80))).toBe(
      "Record personnel : +90 cette semaine"
    )
  })
  test("summary ignores the current week for the best", () => {
    const r = weekSummary({ a: 10, b: 40, c: 99 }, "c", "b")
    expect(r).toEqual({ thisWeek: 99, lastWeek: 40, best: 40 })
  })
})
