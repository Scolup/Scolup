export interface Competency {
  key: string
  level: number | null
  label: string
}

export interface Grade {
  key: string
  subject: string
  subjectCode?: string
  title: string
  typeDevoir?: string
  comment?: string
  date?: Date
  enteredOn?: Date
  value: string
  outOf: string
  coef: string
  period: string
  competencies: Competency[]
  nonSignificant: boolean
}

export interface SubjectGroup {
  subject: string
  subjectCode?: string
  grades: Grade[]
  average: number | null
  coef: number
}

// Résolveur de coefficient d'une matière (code, libellé) — injecté depuis
// l'extérieur pour garder ce fichier sans dépendance.
export type SubjectCoefOf = (
  subjectCode: string | undefined,
  subject: string
) => number

export interface Period {
  id: string
  label: string
  annuel?: boolean
}

interface TrendNewcomer {
  key: string
  title: string
  display: string
  impact: number
}

export interface TrendPoint {
  key: string
  label: string
  fullLabel: string
  average: number | null
  delta: number | null
  newcomers: TrendNewcomer[]
}

export const DEFAULT_EVAL_COLORS = ["#ff0000", "#ffc000", "#1e8910", "#005bb0"]

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

export function toEvalColors(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return DEFAULT_EVAL_COLORS
  const record = raw as Record<string, unknown>
  const colors = [1, 2, 3, 4].map((level) => record[`couleurEval${level}`])
  return colors.every((color) => typeof color === "string" && color)
    ? (colors as string[])
    : DEFAULT_EVAL_COLORS
}

export function parseGradeNumber(raw: unknown): number | null {
  const text = typeof raw === "number" ? String(raw) : (raw as string)
  if (typeof text !== "string") return null
  const normalized = text.trim().replace(",", ".")
  if (!/^[0-9]+(\.[0-9]+)?$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

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

function toCompetencies(raw: unknown): Competency[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry, entryIndex) => {
    if (!entry || typeof entry !== "object") return []
    const record = entry as Record<string, unknown>
    const label =
      (record.libelleCompetence as string) ||
      (record.descriptif as string) ||
      "Compétence"
    const level = parseGradeNumber(record.valeur)
    return [
      {
        key: `${label}-${entryIndex}`,
        level:
          level !== null && Number.isInteger(level) && level >= 1 && level <= 4
            ? level
            : null,
        label,
      },
    ]
  })
}

export function toGrade(raw: Record<string, unknown>, index: number): Grade {
  const subject =
    (raw.libelleMatiere as string) ||
    (raw.codeMatiere as string) ||
    "Sans matière"
  return {
    key: String(
      (raw.id as number | string | undefined) ?? `${subject}-${index}`
    ),
    subject,
    subjectCode:
      typeof raw.codeMatiere === "string" && raw.codeMatiere.trim()
        ? raw.codeMatiere.trim()
        : undefined,
    title: (raw.devoir as string) || "Évaluation",
    typeDevoir:
      typeof raw.typeDevoir === "string" && raw.typeDevoir.trim()
        ? raw.typeDevoir.trim()
        : undefined,
    comment:
      typeof raw.commentaire === "string" && raw.commentaire.trim()
        ? raw.commentaire.trim()
        : undefined,
    date: raw.date instanceof Date ? raw.date : undefined,
    enteredOn: raw.dateSaisie instanceof Date ? raw.dateSaisie : undefined,
    value:
      typeof raw.valeur === "string"
        ? raw.valeur
        : typeof raw.valeur === "number"
          ? String(raw.valeur)
          : "",
    outOf:
      typeof raw.noteSur === "string"
        ? raw.noteSur
        : typeof raw.noteSur === "number"
          ? String(raw.noteSur)
          : "20",
    coef: String(raw.coef ?? "1"),
    period: typeof raw.codePeriode === "string" ? raw.codePeriode : "",
    competencies: toCompetencies(raw.elementsProgramme),
    nonSignificant: raw.nonSignificatif === true || raw.nonSignificatif === "1",
  }
}

// The API lists the all-year period with the bare code `A999Z` and no label.
const PERIOD_LABELS: Record<string, string> = { A999Z: "Année" }

export function toPeriod(raw: Record<string, unknown>): Period | null {
  const id =
    (raw.idPeriode as string) || (raw.codePeriode as string) || undefined
  if (!id) return null
  return {
    id,
    label: (raw.periode as string) || PERIOD_LABELS[id] || id,
    annuel: raw.annuel === true,
  }
}

export function pickDefaultPeriod(periods: Period[]): Period | null {
  return (
    periods.find((period) => period.annuel) ??
    periods.find((period) => period.id === "A999Z") ??
    periods[0] ??
    null
  )
}

export function resolvePeriod(
  periods: Period[],
  preferred: string | undefined
): Period | null {
  return (
    periods.find((period) => period.id === preferred) ??
    pickDefaultPeriod(periods)
  )
}

export function formatAverage(average: number): string {
  return `${formatAverageValue(average)}/20`
}

export function formatAverageValue(average: number): string {
  return average.toFixed(2).replace(".", ",")
}

// Seuil du moment signature "belle note" : une note qui fait plaisir,
// toutes échelles confondues (un 8/10 vaut un 16/20).
export const GREAT_GRADE_THRESHOLD = 16

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

// Interpolation ease-out pour le count-up de la moyenne : pure, testée,
// la partie rAF vit dans AverageCard. `progress` est clampé à [0, 1].
export function countUpValue(
  from: number,
  to: number,
  progress: number
): number {
  const t = Math.min(1, Math.max(0, progress))
  const eased = 1 - Math.pow(1 - t, 3)
  return from + (to - from) * eased
}

export function groupBySubject(
  grades: Grade[],
  coefOf?: SubjectCoefOf
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
        average: subjectAverage(list),
        coef:
          parsed !== undefined && Number.isFinite(parsed) && parsed > 0
            ? parsed
            : 1,
      }
    })
}

export function generalAverage(groups: SubjectGroup[]): number | null {
  let sum = 0
  let weights = 0
  for (const group of groups) {
    if (group.average === null) continue
    sum += group.average * group.coef
    weights += group.coef
  }
  return weights > 0 ? sum / weights : null
}

function startOfDayTime(date: Date): number {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

function gradeAvailableDay(grade: Grade): number | null {
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

export function cumulativeGeneralAverageByDay(
  grades: Grade[],
  coefOf?: SubjectCoefOf,
  days = 30,
  now: Date = new Date()
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
    const average = generalAverage(groupBySubject(upto, coefOf))
    const rounded = average === null ? null : Math.round(average * 100) / 100
    const newcomers: TrendNewcomer[] = []
    if (rounded !== null) {
      for (const entry of dated) {
        if (entry.time !== dayTime) continue
        const rest = upto.filter((grade) => grade !== entry.grade)
        const without = generalAverage(groupBySubject(rest, coefOf))
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
