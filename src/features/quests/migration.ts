import type { ProgressMap } from "./types"
import { QUESTS } from "./catalog"
import { periodKey } from "./period"
import { questPeriod } from "./period"

// Old storage: a JSON array of rewarded quest ids. Those users must keep
// their quests and must NOT be paid twice.
function migrateLegacy(ids: unknown[]): ProgressMap {
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

// Progress of the removed weekly contract (ids "contract:...").
function dropContracts(progress: ProgressMap): ProgressMap {
  return Object.fromEntries(
    Object.entries(progress).filter(([id]) => !id.startsWith("contract:"))
  )
}

export function parseProgress(
  progressRaw: unknown,
  legacyRewardedRaw: unknown
): ProgressMap {
  try {
    if (typeof progressRaw === "string") {
      const parsed: unknown = JSON.parse(progressRaw)
      if (parsed && typeof parsed === "object") {
        return dropContracts(parsed as ProgressMap)
      }
    }
    if (typeof legacyRewardedRaw === "string") {
      const ids: unknown = JSON.parse(legacyRewardedRaw)
      if (Array.isArray(ids)) return migrateLegacy(ids)
    }
  } catch {
    // Progression illisible ou corrompue : on repart de zéro.
  }
  return {}
}
