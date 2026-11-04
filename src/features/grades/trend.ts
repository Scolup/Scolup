import type {
  Grade,
  SubjectCoefOf,
  TrendNewcomer,
  TrendPoint,
  AverageMethod,
} from "./types"
import { gradeAvailableDay, gradeLabel } from "./grade"
import { averageForTrend } from "./averages"

// True when today's general average beats the one from 7 days ago by at
// least 0.05 (the trend has one point per day). Feeds the "average-up" quest:
// it rewards significant progress, not a tiny fluctuation.
export function averageImprovedThisWeek(trend: TrendPoint[]): boolean {
  const now = trend.at(-1)?.average ?? null
  const weekAgo = trend.at(-8)?.average ?? null
  return now !== null && weekAgo !== null && now - weekAgo >= 0.05
}

export function cumulativeGeneralAverageByDay(
  grades: Grade[],
  coefOf?: SubjectCoefOf,
  days = 30,
  now: Date = new Date(),
  method: AverageMethod = "subject"
): TrendPoint[] {
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const dated = grades.flatMap((grade) => {
    const available = gradeAvailableDay(grade)
    return available === null ? [] : [{ grade, time: available }]
  })
  const points: TrendPoint[] = []
  let previous: number | null = null
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(midnight)
    day.setDate(midnight.getDate() - offset)
    const dayTime = day.getTime()
    const upto = dated
      .filter((entry) => entry.time <= dayTime)
      .map((entry) => entry.grade)
    const average = averageForTrend(upto, coefOf, method)
    const rounded = average === null ? null : Math.round(average * 100) / 100
    const newcomers: TrendNewcomer[] = []
    if (rounded !== null) {
      for (const entry of dated) {
        if (entry.time !== dayTime) continue
        const rest = upto.filter((grade) => grade !== entry.grade)
        const without = averageForTrend(rest, coefOf, method)
        const impact = Math.round((rounded - (without ?? 0)) * 100) / 100
        if (impact === 0) continue
        newcomers.push({
          key: entry.grade.key,
          title: entry.grade.title,
          display: gradeLabel(entry.grade),
          impact,
        })
      }
    }
    const delta =
      rounded !== null && previous !== null
        ? Math.round((rounded - previous) * 100) / 100
        : null
    if (rounded !== null) previous = rounded
    points.push({
      key: String(dayTime),
      label: day.toLocaleDateString("fr", {
        day: "numeric",
        month: "numeric",
      }),
      fullLabel: day.toLocaleDateString("fr", {
        day: "numeric",
        month: "long",
      }),
      average: rounded,
      delta,
      newcomers,
    })
  }
  return points
}

// Bornes verticales du graphe : de la plus basse à la plus haute moyenne, avec
// une marge d'un demi-point. Sans aucune moyenne, on affiche de 0 à 20.
export function computeTrendDomain(points: TrendPoint[]): [number, number] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const point of points) {
    if (point.average === null) continue
    if (point.average < min) min = point.average
    if (point.average > max) max = point.average
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 20]
  return [Math.max(0, min - 0.5), Math.min(20, max + 0.5)]
}

// Impact de chaque note sur la moyenne (points gagnés ou perdus), retrouvé
// par la clé de la note.
export function impactsByGrade(trend: TrendPoint[]): Map<string, number> {
  return new Map(
    trend.flatMap((point) =>
      point.newcomers.map(
        (newcomer) => [newcomer.key, newcomer.impact] as const
      )
    )
  )
}
