import type { Grade } from "./types"

export function formatGradeDate(date?: Date): string {
  if (!date) return ""
  return date.toLocaleDateString("fr", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function hasGradeValue(grade: Grade): boolean {
  return grade.value.trim() !== ""
}

export function parseGradeNumber(raw: unknown): number | null {
  const text = typeof raw === "number" ? String(raw) : (raw as string)
  if (typeof text !== "string") return null
  const normalized = text.trim().replace(",", ".")
  if (!/^[0-9]+(\.[0-9]+)?$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

// Seuil du moment signature "belle note" : une note qui fait plaisir,
// toutes échelles confondues (un 8/10 vaut un 16/20).
const GREAT_GRADE_THRESHOLD = 16

// Note ramenée sur 20, ou null si elle n'est pas chiffrable. Seules les
// notes significatives comptent : on ne célèbre jamais une note
// non significative ou une évaluation par compétences.
export function gradeScore20(grade: Grade): number | null {
  if (grade.nonSignificant || !hasGradeValue(grade)) return null
  const value = parseGradeNumber(grade.value)
  const outOf = parseGradeNumber(grade.outOf)
  if (value === null || outOf === null || outOf <= 0) return null
  return (value / outOf) * 20
}

export function isGreatGrade(grade: Grade): boolean {
  const score = gradeScore20(grade)
  return score !== null && score >= GREAT_GRADE_THRESHOLD
}

function startOfDayTime(date: Date): number {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

export function gradeAvailableDay(grade: Grade): number | null {
  const exam = grade.date ?? grade.enteredOn
  const out = grade.enteredOn ?? grade.date
  if (!exam || !out) return null
  return Math.max(startOfDayTime(exam), startOfDayTime(out))
}

export function gradeLabel(grade: Grade): string {
  if (!grade.value.trim()) return "—"
  if (!/^[0-9.,]+$/.test(grade.value.trim())) return grade.value
  return `${grade.value.replace(".", ",")}/${grade.outOf}`
}

// Les notes saisies dans les `days` derniers jours, les plus récentes d'abord.
export function recentGrades(grades: Grade[], days: number): Grade[] {
  const cutoff = Date.now() - days * 86_400_000
  return grades
    .filter(
      (grade) =>
        grade.enteredOn instanceof Date && grade.enteredOn.getTime() >= cutoff
    )
    .sort(
      (a, b) =>
        (b.enteredOn as Date).getTime() - (a.enteredOn as Date).getTime()
    )
}
