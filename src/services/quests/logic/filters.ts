import type { QuestDef } from "../types"
import { dayKey } from "../utils/date"

// Quests that can progress right now (generated ones included).
export function activeQuests(
  quests: QuestDef[],
  now: Date,
  hideGrades = false
): QuestDef[] {
  const today = dayKey(now)
  return quests.filter(
    (quest) =>
      !(hideGrades && quest.grades) && !(quest.expires && today > quest.expires)
  )
}
