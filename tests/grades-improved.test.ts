import { expect, test } from "bun:test"
import {
  averageImprovedThisWeek,
  type TrendPoint,
} from "../src/pages/grades/helpers"

const trend = (averages: (number | null)[]): TrendPoint[] =>
  averages.map((average, i) => ({
    key: String(i),
    label: "",
    fullLabel: "",
    average,
    delta: null,
    newcomers: [],
  }))

test("improved when today's average beats 7 days ago", () => {
  expect(averageImprovedThisWeek(trend([10, 10, 10, 10, 10, 10, 10, 11]))).toBe(
    true
  )
})
test("not improved when equal, lower, missing or too short", () => {
  expect(averageImprovedThisWeek(trend([12, 10, 10, 10, 10, 10, 10, 12]))).toBe(
    false
  )
  expect(averageImprovedThisWeek(trend([13, 10, 10, 10, 10, 10, 10, 12]))).toBe(
    false
  )
  expect(
    averageImprovedThisWeek(
      trend([null, null, null, null, null, null, null, 12])
    )
  ).toBe(false)
  expect(averageImprovedThisWeek(trend([10, 11]))).toBe(false)
})
