import { describe, expect, test } from "bun:test"
import { groupQuests } from "../src/pages/shop/helpers"
import type { QuestItem } from "../src/hooks/use-quests"

function quest(overrides: Partial<QuestItem> & { id: string }): QuestItem {
  return {
    title: overrides.id,
    description: "",
    reward: 1,
    event: "app-open",
    period: "once",
    state: "unachieved",
    count: 0,
    goal: 1,
    ...overrides,
  }
}

describe("groupQuests", () => {
  test("shows only the closest tier of a track", () => {
    const { groups, achieved } = groupQuests([
      quest({
        id: "25",
        track: "devoirs",
        goal: 25,
        count: 25,
        state: "achieved",
      }),
      quest({ id: "100", track: "devoirs", goal: 100, count: 30 }),
      quest({ id: "250", track: "devoirs", goal: 250, count: 30 }),
    ])

    expect(groups.map((group) => group.quest.id)).toEqual(["100"])
    expect(groups[0].tier).toBe(2)
    expect(groups[0].tiers).toBe(3)
    expect(achieved.map((q) => q.id)).toEqual(["25"])
  })

  test("hides a secret tier and the tiers behind it", () => {
    const { groups, achieved } = groupQuests([
      quest({ id: "3", track: "notes", goal: 3, count: 3, state: "achieved" }),
      quest({ id: "7", track: "notes", goal: 7, state: "secret" }),
      quest({ id: "15", track: "notes", goal: 15 }),
    ])

    expect(groups).toEqual([])
    expect(achieved.map((q) => q.id)).toEqual(["3"])
  })

  test("puts weekly quests before long-term ones", () => {
    const { groups } = groupQuests([
      quest({ id: "long", goal: 10, count: 9 }),
      quest({ id: "week", period: "weekly", goal: 3 }),
    ])

    expect(groups.map((group) => group.quest.id)).toEqual(["week", "long"])
  })

  test("keeps quests without a track separate", () => {
    const { groups } = groupQuests([quest({ id: "a" }), quest({ id: "b" })])

    expect(groups).toHaveLength(2)
  })
})
