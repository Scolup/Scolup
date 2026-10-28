import type { QuestMatch, QuestPayload } from "../types"

export function matches(match: QuestMatch | undefined, payload?: QuestPayload) {
  if (!match) return true
  if (match.subject !== undefined && payload?.subject !== match.subject) {
    return false
  }
  if (
    match.minRatio !== undefined &&
    (payload?.ratio === undefined || payload.ratio < match.minRatio)
  ) {
    return false
  }
  if (match.improved && !payload?.improved) return false
  return true
}
