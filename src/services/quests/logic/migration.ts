import type { ProgressMap } from "../types"
import { QUESTS } from "../catalog/quests"
import { periodKey } from "../utils/date"
import { questPeriod } from "../utils"

// Old storage: a JSON array of rewarded quest ids. Those users must keep
// their quests and must NOT be paid twice.
export function migrateLegacy(ids: unknown[]): ProgressMap {
  const result: ProgressMap = {}
  for (const quest of QUESTS) {
    if (!quest.income && ids.includes(quest.id)) {
      result[quest.id] = {
        count: quest.goal ?? 1,
        period: periodKey(questPeriod(quest), new Date()),
        done: true,
      }
    }
  }
  return result
}

export function parseProgress(
  progressRaw: unknown,
  legacyRewardedRaw: unknown
): ProgressMap {
  try {
    if (typeof progressRaw === "string") {
      const parsed: unknown = JSON.parse(progressRaw)
      if (parsed && typeof parsed === "object") return parsed as ProgressMap
    }
    if (typeof legacyRewardedRaw === "string") {
      const ids: unknown = JSON.parse(legacyRewardedRaw)
      if (Array.isArray(ids)) return migrateLegacy(ids)
    }
  } catch {}
  return {}
}
