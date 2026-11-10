import type {
  Grade,
  SubjectGroup,
  SubjectCoefOf,
  AverageMethod,
  AverageScale,
} from "./types"
import { parseGradeNumber, gradeScore20 } from "./grade"

function subjectAverage(grades: Grade[]): number | null {
  let weighted = 0
  let weights = 0
  for (const grade of grades) {
    if (grade.nonSignificant) continue
    const value = parseGradeNumber(grade.value)
    const outOf = parseGradeNumber(grade.outOf)
    if (value === null || outOf === null || outOf <= 0) continue
    const coef = parseGradeNumber(grade.coef)
    const weight = coef === null || coef <= 0 ? 1 : coef
    weighted += (value / outOf) * 20 * weight
    weights += weight
  }
  return weights > 0 ? weighted / weights : null
}

function subjectAverageForMethod(
  grades: Grade[],
  method: AverageMethod = "subject"
): number | null {
  if (method === "median") {
    const scores = grades.flatMap((grade) => {
      const score = gradeScore20(grade)
      return score === null ? [] : [score]
    })
    if (scores.length === 0) return null
    scores.sort((a, b) => a - b)
    const middle = Math.floor(scores.length / 2)
    return scores.length % 2 === 1
      ? scores[middle]
      : (scores[middle - 1] + scores[middle]) / 2
  }
  return subjectAverage(grades)
}

export function isAverageMethod(value: unknown): value is AverageMethod {
  return value === "subject" || value === "weighted" || value === "median"
}

export function isAverageScale(value: unknown): value is AverageScale {
  return value === 20 || value === 10 || value === 100
}

function convertAverage(average20: number, scale: AverageScale): number {
  return (average20 * scale) / 20
}

export function formatAverage(
  average: number,
  scale: AverageScale = 20
): string {
  if (scale === 100) return `${formatAverageValue(average, scale)} %`
  return `${formatAverageValue(average, scale)}/${scale}`
}

export function formatAverageValue(
  average: number,
  scale: AverageScale = 20
): string {
  return convertAverage(average, scale).toFixed(2).replace(".", ",")
}

export function groupBySubject(
  grades: Grade[],
  coefOf?: SubjectCoefOf,
  method: AverageMethod = "subject"
): SubjectGroup[] {
  const groups = new Map<string, Grade[]>()
  for (const grade of grades) {
    const list = groups.get(grade.subject)
    if (list) list.push(grade)
    else groups.set(grade.subject, [grade])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([subject, list]) => {
      const subjectCode = list.find((grade) => grade.subjectCode)?.subjectCode
      const parsed = coefOf?.(subjectCode, subject)
      return {
        subject,
        subjectCode,
        grades: list.sort(
          (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
        ),
        average: subjectAverageForMethod(list, method),
        coef:
          parsed !== undefined && Number.isFinite(parsed) && parsed > 0
            ? parsed
            : 1,
      }
    })
}

function generalAverage(groups: SubjectGroup[]): number | null {
  let sum = 0
  let weights = 0
  for (const group of groups) {
    if (group.average === null) continue
    sum += group.average * group.coef
    weights += group.coef
  }
  return weights > 0 ? sum / weights : null
}

// Moyenne pondérée globale : toutes les notes dans un seul panier, chacune
// pesée par coef du devoir × coef de sa matière.
export function weightedAverage(
  grades: Grade[],
  coefOf?: SubjectCoefOf
): number | null {
  let weighted = 0
  let weights = 0
  for (const grade of grades) {
    const score = gradeScore20(grade)
    if (score === null) continue
    const gradeCoef = parseGradeNumber(grade.coef)
    const subjectCoef = coefOf?.(grade.subjectCode, grade.subject) ?? 1
    const safeSubject =
      Number.isFinite(subjectCoef) && subjectCoef > 0 ? subjectCoef : 1
    const safeGrade = gradeCoef !== null && gradeCoef > 0 ? gradeCoef : 1
    const weight = safeGrade * safeSubject
    weighted += score * weight
    weights += weight
  }
  return weights > 0 ? weighted / weights : null
}

// Médiane des notes ramenées sur 20 (chaque note compte une fois,
// sans pondération).
export function medianAverage(grades: Grade[]): number | null {
  const scores = grades.flatMap((grade) => {
    const score = gradeScore20(grade)
    return score === null ? [] : [score]
  })
  if (scores.length === 0) return null
  scores.sort((a, b) => a - b)
  const middle = Math.floor(scores.length / 2)
  return scores.length % 2 === 1
    ? scores[middle]
    : (scores[middle - 1] + scores[middle]) / 2
}

export function computeOverallAverage(
  grades: Grade[],
  groups: SubjectGroup[],
  coefOf?: SubjectCoefOf,
  method: AverageMethod = "subject"
): number | null {
  if (method === "weighted") return weightedAverage(grades, coefOf)
  if (method === "median") return medianAverage(grades)
  return generalAverage(groups)
}

export function averageForTrend(
  grades: Grade[],
  coefOf?: SubjectCoefOf,
  method: AverageMethod = "subject"
): number | null {
  if (method === "weighted") return weightedAverage(grades, coefOf)
  if (method === "median") return medianAverage(grades)
  return generalAverage(groupBySubject(grades, coefOf, method))
}
