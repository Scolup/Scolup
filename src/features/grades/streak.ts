import type { Grade, SubjectCoefOf, AverageMethod } from "./types"
import { gradeScore20, gradeAvailableDay } from "./grade"
import { averageForTrend } from "./averages"

// ---- Série de notes ---------------------------------------------------
// Une note garde la série si elle ne fait pas baisser la moyenne générale de
// sa période : moyenne avec / sans elle, au centième comme le graphe. Une note
// d'au moins STREAK_SAFE_SCORE sur 20 ne la casse jamais : à 17 de moyenne,
// presque toute note la ferait baisser.
// Renvoie null quand la note ne dit rien (absente, non significative,
// première de la période) : elle ne compte pas et ne casse rien.
const STREAK_SAFE_SCORE = 17

export function gradeKeepsStreak(
  grade: Grade,
  grades: Grade[],
  coefOf?: SubjectCoefOf,
  method: AverageMethod = "subject"
): boolean | null {
  const score = gradeScore20(grade)
  if (score === null) return null
  if (score >= STREAK_SAFE_SCORE) return true
  const day = gradeAvailableDay(grade)
  if (day === null) return null
  // La moyenne telle qu'elle était le jour de la note, dans sa période.
  const upto = grades.filter((other) => {
    if (other.period !== grade.period) return false
    const otherDay = gradeAvailableDay(other)
    return otherDay !== null && otherDay <= day
  })
  // La médiane bouge trop peu, la série serait trop facile.
  const used = method === "median" ? "subject" : method
  const without = averageForTrend(
    upto.filter((other) => other.key !== grade.key),
    coefOf,
    used
  )
  const withGrade = averageForTrend(upto, coefOf, used)
  if (without === null || withGrade === null) return null
  const rounded = Math.round(withGrade * 100) / 100
  return Math.round((rounded - without) * 100) / 100 >= 0
}
