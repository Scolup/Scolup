import type { QuestItem } from "@/hooks/use-quests"

// One row in the shop: the closest tier of a quest track.
export interface QuestGroup {
  quest: QuestItem
  tier: number
  tiers: number
}

const PERIOD_ORDER = { daily: 0, weekly: 1, once: 2 }

function progress(quest: QuestItem): number {
  return quest.count / quest.goal
}

// Ladders (25/100/250 homework...) show only their closest tier. Secret quests
// stay hidden until achieved, and completed quests move to their own list.
export function groupQuests(quests: QuestItem[]): {
  groups: QuestGroup[]
  achieved: QuestItem[]
} {
  const tracks = new Map<string, QuestItem[]>()
  for (const quest of quests) {
    const key = quest.track ?? quest.id
    const track = tracks.get(key)
    if (track) track.push(quest)
    else tracks.set(key, [quest])
  }

  const groups: QuestGroup[] = []
  for (const track of tracks.values()) {
    const tiers = [...track].sort((a, b) => a.goal - b.goal)
    const index = tiers.findIndex((quest) => quest.state !== "achieved")
    // A hidden tier also hides the ones behind it.
    if (index === -1 || tiers[index].state === "secret") continue
    groups.push({ quest: tiers[index], tier: index + 1, tiers: tiers.length })
  }

  groups.sort(
    (a, b) =>
      PERIOD_ORDER[a.quest.period] - PERIOD_ORDER[b.quest.period] ||
      progress(b.quest) - progress(a.quest)
  )

  return {
    groups,
    achieved: quests.filter((quest) => quest.state === "achieved"),
  }
}
