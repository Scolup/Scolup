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
  const goal = quest.goal ?? 1
  const state: QuestState = current?.done
    ? "achieved"
    : quest.secret
      ? "secret"
      : "unachieved"
  return { goal, count: Math.min(current?.count ?? 0, goal), state }
}
