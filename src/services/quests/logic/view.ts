import type { ProgressMap, QuestDef, QuestState } from "../types"
import { periodKey } from "../utils/date"
import { questPeriod } from "../utils"

// What the UI shows for a quest (progress of a past period counts as 0).
export function questView(
  quest: QuestDef,
  progress: ProgressMap,
  now: Date
): { goal: number; count: number; state: QuestState } {
  const saved = progress[quest.id]
  const current =
    saved && saved.period === periodKey(questPeriod(quest), now) ? saved : null
  // Streak quests: the ring shows the live streak, up to the tier to reach.
  const goal = quest.gauge ? (quest.match?.minStreak ?? 1) : (quest.goal ?? 1)
  const live = quest.gauge ? progress[quest.gauge]?.count : current?.count
  const state: QuestState = current?.done
    ? "achieved"
    : quest.secret
      ? "secret"
      : "unachieved"
  const count = current?.done ? goal : (live ?? 0)
  return { goal, count: Math.min(count, goal), state }
}
