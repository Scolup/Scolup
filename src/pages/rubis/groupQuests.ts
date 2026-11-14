import type { QuestItem } from "@/features/quests/useQuests"

// One row in the list: each tier of a track gets its own row.
export interface QuestGroup {
  quest: QuestItem
  tier: number
  tiers: number
}

const PERIOD_ORDER = { daily: 0, weekly: 1, once: 2 }

// Every quest is listed: all the tiers of a track, secret ones included (their
// row hides the text until achieved), and completed quests move to their own
// list.
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
    tiers.forEach((quest, index) => {
      if (quest.state === "achieved") return
      groups.push({ quest, tier: index + 1, tiers: tiers.length })
    })
  }

  groups.sort(
    (a, b) => PERIOD_ORDER[a.quest.period] - PERIOD_ORDER[b.quest.period]
  )

  return {
    groups,
    achieved: quests.filter((quest) => quest.state === "achieved"),
  }
}
