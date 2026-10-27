import { describe, expect, test } from "bun:test"
import {
  activeQuests,
  applyEvent,
  migrateLegacy,
  parseProgress,
  QUESTS,
  questView,
  toastText,
  type QuestDef,
} from "../src/services/quest-rules"

const once: QuestDef = {
  id: "a",
  title: "A",
  description: "",
  reward: 10,
  event: "homework-done",
}
const weekly: QuestDef = {
  id: "w",
  title: "W",
  description: "",
  reward: 20,
  event: "app-open",
  goal: 3,
  period: "weekly",
  perDay: true,
}
const uniq: QuestDef = {
  id: "u",
  title: "U",
  description: "",
  reward: 5,
  event: "homework-done",
  goal: 2,
  unique: true,
  period: "weekly",
}
const day = (s: string) => new Date(`${s}T12:00:00`)

describe("applyEvent", () => {
  test("pays a one-shot quest exactly once", () => {
    const first = applyEvent([once], {}, "homework-done", day("2026-10-27"))
    expect(first.completed).toEqual([once])
    const second = applyEvent(
      [once],
      first.progress,
      "homework-done",
      day("2026-10-28")
    )
    expect(second.completed).toEqual([])
  })

  test("ignores other events", () => {
    expect(
      applyEvent([once], {}, "app-open", day("2026-10-27")).completed
    ).toEqual([])
  })

  test("perDay counts one per day", () => {
    let p = applyEvent([weekly], {}, "app-open", day("2026-10-26")).progress
    p = applyEvent([weekly], p, "app-open", day("2026-10-26")).progress
    expect(p.w.count).toBe(1)
  })

  test("weekly quest completes within one Monday-Sunday week", () => {
    let r = applyEvent([weekly], {}, "app-open", day("2026-10-26"))
    r = applyEvent([weekly], r.progress, "app-open", day("2026-10-27"))
    r = applyEvent([weekly], r.progress, "app-open", day("2026-10-30"))
    expect(r.completed).toEqual([weekly])
  })

  test("weekly progress resets on a new week", () => {
    let p = applyEvent([weekly], {}, "app-open", day("2026-10-26")).progress
    p = applyEvent([weekly], p, "app-open", day("2026-10-27")).progress
    const r = applyEvent([weekly], p, "app-open", day("2026-11-02"))
    expect(r.progress.w.count).toBe(1)
    expect(r.completed).toEqual([])
  })

  test("a weekly quest can be won again next week", () => {
    let p = {}
    for (const d of ["2026-10-26", "2026-10-27", "2026-10-28"]) {
      p = applyEvent([weekly], p, "app-open", day(d)).progress
    }
    let r = applyEvent([weekly], p, "app-open", day("2026-11-02"))
    r = applyEvent([weekly], r.progress, "app-open", day("2026-11-03"))
    r = applyEvent([weekly], r.progress, "app-open", day("2026-11-04"))
    expect(r.completed).toEqual([weekly])
  })

  test("unique quests count each key once (no tick/untick farming)", () => {
    let r = applyEvent([uniq], {}, "homework-done", day("2026-10-27"), "hw1")
    r = applyEvent(
      [uniq],
      r.progress,
      "homework-done",
      day("2026-10-27"),
      "hw1"
    )
    expect(r.progress.u.count).toBe(1)
    r = applyEvent(
      [uniq],
      r.progress,
      "homework-done",
      day("2026-10-27"),
      "hw2"
    )
    expect(r.completed).toEqual([uniq])
  })

  test("does not mutate its input", () => {
    const input = {}
    applyEvent([once], input, "homework-done", day("2026-10-27"))
    expect(input).toEqual({})
  })
})

describe("rotation", () => {
  test("same day => same picks, 2 daily + 2 weekly pool quests active", () => {
    const a = activeQuests(QUESTS, day("2026-10-27"))
    const b = activeQuests(QUESTS, day("2026-10-27"))
    expect(a).toEqual(b)
    expect(a.filter((q) => q.pool === "daily")).toHaveLength(2)
    expect(a.filter((q) => q.pool === "weekly")).toHaveLength(2)
  })

  test("weekly picks stay the same all week", () => {
    const weeklyIds = (d: string) =>
      activeQuests(QUESTS, day(d))
        .filter((q) => q.pool === "weekly")
        .map((q) => q.id)
    expect(weeklyIds("2026-10-26")).toEqual(weeklyIds("2026-11-01"))
  })

  test("every quest id is unique", () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length)
  })
})

describe("questView / migration / toast", () => {
  test("stale period reads as 0", () => {
    const p = applyEvent([weekly], {}, "app-open", day("2026-10-26")).progress
    expect(questView(weekly, p, day("2026-11-03")).count).toBe(0)
  })

  test("legacy rewarded ids stay achieved and are not re-paid", () => {
    const p = migrateLegacy(["bienvenue", "unknown-id"])
    expect(Object.keys(p)).toEqual(["bienvenue"])
    expect(p.bienvenue.done).toBe(true)
    const r = applyEvent(QUESTS, p, "app-open", day("2026-10-27"))
    expect(r.completed.map((q) => q.id)).not.toContain("bienvenue")
  })

  test("parseProgress survives garbage", () => {
    expect(parseProgress("{{{", undefined)).toEqual({})
    expect(parseProgress(undefined, undefined)).toEqual({})
  })

  test("toast text", () => {
    expect(toastText({ quests: [once] })).toBe(
      "Quête accomplie : A (+10 rubis)"
    )
    expect(toastText({ quests: [once, weekly] })).toBe(
      "2 quêtes accomplies (+30 rubis)"
    )
  })
})
