import type { QuestMatch, QuestPayload } from "../types"

// Ratios are divisions: 0.75 - 0.7 is 0.04999..., not 0.05.
const EPSILON = 1e-9

function atLeast(value: number | undefined, min: number): boolean {
  return value !== undefined && value >= min - EPSILON
}

export function matches(match: QuestMatch | undefined, payload?: QuestPayload) {
  if (!match) return true
  if (match.subject !== undefined && payload?.subject !== match.subject) {
    return false
  }
  if (
    match.minRatio !== undefined &&
    !atLeast(payload?.ratio, match.minRatio)
  ) {
    return false
  }
  if (match.improved && !payload?.improved) return false
  if (
    match.minAboveAvg !== undefined &&
    !atLeast(payload?.aboveAvg, match.minAboveAvg)
  ) {
    return false
  }
  if (
    match.minDelta !== undefined &&
    !atLeast(payload?.delta, match.minDelta)
  ) {
    return false
  }
  if (
    match.minStreak !== undefined &&
    !atLeast(payload?.streak, match.minStreak)
  ) {
    return false
  }
  return true
}
