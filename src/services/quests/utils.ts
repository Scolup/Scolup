import type { QuestDef, QuestPeriod } from "./types"

export function questPeriod(quest: QuestDef): QuestPeriod {
  return quest.period ?? "once"
}

export function subjectId(code?: string, name?: string): string {
  return code?.trim() || name?.trim() || "?"
}
