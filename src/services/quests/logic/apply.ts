import type {
  QuestDef,
  QuestEvent,
  QuestPayload,
  QuestProgress,
  ProgressMap,
} from "../types"
import { questPeriod } from "../utils"
import { periodKey } from "../utils/date"
import { matches } from "./match"

const MAX_SEEN = 300

// Registers one event. Returns the new progress and what it paid.
// Never mutates its input. `key` identifies the thing (a homework id) for
// `unique` and `income` quests, so ticking the same homework twice pays once.
export function applyEvent(
  quests: QuestDef[],
  progress: ProgressMap,
  event: QuestEvent,
  now: Date,
  key?: string,
  payload?: QuestPayload
): { progress: ProgressMap; completed: QuestDef[] } {
  const next: ProgressMap = { ...progress }
  const completed: QuestDef[] = []

  for (const quest of quests) {
    if (quest.event !== event || !matches(quest.match, payload)) continue
    if (quest.income && key === undefined) continue

    const period = periodKey(questPeriod(quest), now)
    const saved = next[quest.id]
    // New period (new week)? Start from zero.
    const current: QuestProgress =
      saved && saved.period === period
        ? saved
        : { count: 0, period, done: false }

    if (current.done) continue
    const byKey = (quest.unique || quest.income) && key !== undefined
    if (byKey && current.seen?.includes(key)) continue

    const count = current.count + 1
    const updated: QuestProgress = { count, period, done: false }
    if (byKey) updated.seen = [...(current.seen ?? []), key].slice(-MAX_SEEN)
    else if (current.seen) updated.seen = current.seen

    if (quest.income) {
      completed.push(quest)
    } else if (count >= (quest.goal ?? 1)) {
      updated.done = true
      completed.push(quest)
    }
    next[quest.id] = updated
  }

  return { progress: next, completed }
}
