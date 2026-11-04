import { minutesOfDay } from "@/lib/dates"
import type { RawCourse, CourseKind, CourseStatus, Course } from "./types"
import {
  onlineKeywords,
  evaluatedKeywords,
  normalizeLabel,
  lunchKeywords,
  breakKeywords,
} from "./keywords"

function toDate(value: Date | string | undefined): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== "string") return null
  const parsed = new Date(value.replace(" ", "T"))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function stableCourseId(parts: Array<string | number>): string {
  const input = parts.join("|")
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `c-${(hash >>> 0).toString(36)}`
}

function detectStatus(raw: RawCourse): CourseStatus | undefined {
  const label = normalizeLabel(
    `${raw.typeCours ?? ""} ${raw.matiere ?? ""} ${raw.text ?? ""}`
  )
  if (matches(label, onlineKeywords)) return "online"
  if (matches(label, evaluatedKeywords)) return "evaluated"
  return undefined
}

function extractDetails(raw: RawCourse, title: string): string | undefined {
  const text = raw.text?.trim()
  if (!text || text === title) return undefined
  const normalizedText = normalizeLabel(text)
  const normalizedTitle = normalizeLabel(title)
  if (!normalizedText || normalizedText === normalizedTitle) return undefined
  if (normalizedText.length <= 2) return undefined
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
}

function matches(label: string, keywords: string[]): boolean {
  return keywords.some((keyword) => label.includes(keyword))
}

function courseKind(raw: RawCourse): CourseKind {
  const label = normalizeLabel(
    `${raw.typeCours ?? ""} ${raw.matiere ?? ""} ${raw.text ?? ""}`
  )
  if (matches(label, lunchKeywords)) return "lunch"
  if (matches(label, breakKeywords)) return "break"
  return "course"
}

// L'API renvoie soit la liste des cours, soit un objet { timetable: [...] }.
function timetableCourses<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const wrapped = (payload as { timetable?: unknown } | null)?.timetable
  return Array.isArray(wrapped) ? (wrapped as T[]) : []
}

export function normalizeTimetable(payload: unknown): Course[] {
  const courses = timetableCourses<RawCourse>(payload)

  return courses
    .map((raw, index): Course | null => {
      if (!raw || typeof raw !== "object") return null
      const title =
        raw.matiere?.trim() || raw.text?.trim() || raw.classe?.trim() || "Cours"
      const start = toDate(raw.start_date)
      const end = toDate(raw.end_date)
      const id = Number(raw.id)
      const teacher = raw.prof?.trim() || undefined
      const stableId = stableCourseId([
        Number.isFinite(id) ? id : "x",
        start ? start.getTime() : index,
        end ? end.getTime() : 0,
        title,
        teacher ?? "",
      ])

      return {
        key: stableId,
        stableId,
        id: Number.isFinite(id) ? id : 0,
        title,
        subjectCode: raw.codeMatiere,
        kind: courseKind(raw),
        status: detectStatus(raw),
        details: extractDetails(raw, title),
        start,
        end,
        color:
          typeof raw.color === "string" && raw.color.trim()
            ? raw.color
            : undefined,
        teacher: raw.prof?.trim() || undefined,
        room: raw.salle?.trim() || undefined,
        group: raw.groupe?.trim() || undefined,
        cancelled: Boolean(raw.isAnnule),
        modified: Boolean(raw.isModifie),
        hasHomework: Boolean(raw.devoirAFaire),
        hasLessonContent: Boolean(raw.contenuDeSeance),
      }
    })
    .filter((course): course is Course => course !== null)
    .filter((course) => !isAllDay(course))
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
}

function isAllDay(course: Course): boolean {
  if (!course.start || !course.end) return false
  const span = (course.end.getTime() - course.start.getTime()) / 60_000
  if (span >= 23 * 60) return true
  return (
    minutesOfDay(course.start) <= 1 && minutesOfDay(course.end) >= 23 * 60 + 58
  )
}
