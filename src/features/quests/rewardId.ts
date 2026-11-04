import { periodKey, questPeriod } from "./period"
import type { QuestDef } from "./types"

// Identifiant d'une récompense. Il est DÉTERMINISTE : deux appareils qui
// valident la même quête (ou paient le même devoir) obtiennent le même id, et
// le portefeuille ne la compte donc qu'une fois après fusion.
//   quête normale : une fois par période (jamais pour "once", par semaine/jour sinon)
//   quête "income" : une fois par clé (un devoir) et par période
export function rewardId(quest: QuestDef, now: Date, key?: string): string {
  const period = periodKey(questPeriod(quest), now)
  return quest.income
    ? `income:${quest.id}:${period}:${key ?? ""}`
    : `quest:${quest.id}:${period}`
}
