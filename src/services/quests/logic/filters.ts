import type { QuestDef } from "../types"

// Quests that can progress right now.
export function activeQuests(
  quests: QuestDef[],
  hideGrades = false
): QuestDef[] {
  return quests.filter((quest) => !(hideGrades && quest.grades))
}
