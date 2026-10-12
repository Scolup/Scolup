import {
  Award01Icon,
  GhostIcon,
  LibraryIcon,
  Notebook01Icon,
  Video02Icon,
} from "@hugeicons/core-free-icons"
import { timetableCourses } from "@/services/timetable"
import {
  capitalize,
  dayName,
  daysUntil,
  hoursLabel,
  minutesOfDay,
  toDayKey,
} from "@/services/dates"

export interface RawCourse {
  id?: number
  text?: string
  matiere?: string
  classe?: string
  codeMatiere?: string
  typeCours?: string
  start_date?: Date | string
  end_date?: Date | string
  color?: string
  prof?: string
  salle?: string
  groupe?: string
  isAnnule?: boolean
  isModifie?: boolean
  dispense?: number
  contenuDeSeance?: boolean
  devoirAFaire?: boolean
}

export type CourseKind = "lunch" | "break" | "course"

export type CourseStatus = "online" | "evaluated"

export interface Course {
  key: string
  stableId: string
  id: number
  title: string
  subjectCode?: string
  kind: CourseKind
  status?: CourseStatus
  details?: string
  start: Date | null
  end: Date | null
  color?: string
  teacher?: string
  room?: string
  group?: string
  cancelled: boolean
  modified: boolean
  hasHomework: boolean
  hasLessonContent: boolean
}

export type AgendaView = "day" | "week"

export type TimedCourse = Course & { start: Date; end: Date }

export interface Gap {
  key: string
  start: number
  end: number
  midday: boolean
  label: string
}

export const MIN_GAP_MINUTES = 10
export const SEPARATOR_MIN_MINUTES = 10
export const MIDDAY_START_MINUTES = 11 * 60 + 30
export const MIDDAY_END_MINUTES = 14 * 60

export const onlineKeywords = [
  "distanciel",
  "visio",
  "visioconference",
  "classe virtuelle",
  "teams",
  "zoom",
  "en ligne",
]

export const evaluatedKeywords = [
  "devoir surveille",
  "devoir commun",
  "evaluation",
  "controle",
  "examen",
  "epreuve",
  "brevet",
  "bac blanc",
  "qcm note",
  "interrogation",
  " ds",
  "(ds)",
]

export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export const lunchKeywords = [
  "repas",
  "dejeuner",
  "cantine",
  "self",
  "meridienne",
  "restauration",
  "demi-pension",
  "pause midi",
]

export const breakKeywords = [
  "recreation",
  "permanence",
  "etude",
  "pause",
  "vie scolaire",
]

export function dayLabel(date: Date, now = new Date()): string {
  const delta = daysUntil(date, now)
  if (delta === 0) return "Aujourd'hui"
  if (delta === 1) return "Demain"
  if (delta === -1) return "Hier"
  return capitalize(`${dayName(date)} ${date.getDate()}`)
}

export function durationLabel(course: Course): string {
  if (!course.start || !course.end) return ""
  const minutes = Math.round(
    (course.end.getTime() - course.start.getTime()) / 60_000
  )
  return minutes > 0 ? hoursLabel(minutes) : ""
}

function courseDayKey(course: Course): string {
  return course.start ? toDayKey(course.start) : ""
}

export function coursesForDay(courses: Course[], key: string): Course[] {
  return courses.filter((course) => courseDayKey(course) === key)
}

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

export function countdownLabel(from: Date, to: Date): string {
  const minutes = Math.max(
    0,
    Math.round((to.getTime() - from.getTime()) / 60_000)
  )
  if (minutes < 1) return "maintenant"
  if (minutes < 60) return `dans ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24)
    return rest === 0
      ? `dans ${hours} h`
      : `dans ${hours} h ${String(rest).padStart(2, "0")}`
  const days = Math.floor(hours / 24)
  return days === 1 ? "demain" : `dans ${days} j`
}

export function courseRelativeLabel(
  course: Course,
  now = new Date()
): string | null {
  if (!course.start || !course.end) return null
  if (now.getTime() < course.start.getTime())
    return countdownLabel(now, course.start)
  if (now.getTime() < course.end.getTime()) {
    const left = Math.round((course.end.getTime() - now.getTime()) / 60_000)
    if (left <= 0) return "se termine"
    if (left < 60) return `se termine dans ${left} min`
    return "en ce moment"
  }
  return null
}

export function isOngoing(course: Course, now: Date): boolean {
  if (!course.start || !course.end) return false
  return (
    now.getTime() >= course.start.getTime() &&
    now.getTime() < course.end.getTime()
  )
}

export function nextCourse(courses: Course[], now = new Date()): Course | null {
  const upcoming = courses
    .filter(
      (c) => c.start && c.end && !c.cancelled && c.end.getTime() > now.getTime()
    )
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
  return (
    upcoming.find((c) => (c.start?.getTime() ?? 0) > now.getTime()) ??
    upcoming[0] ??
    null
  )
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

function isMiddayGap(start: number, end: number): boolean {
  return start < MIDDAY_END_MINUTES && end > MIDDAY_START_MINUTES
}

export function buildGaps(courses: Course[]): Gap[] {
  const timed = courses
    .filter((course) => course.start && course.end && !course.cancelled)
    .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
  if (timed.length < 2) return []

  const gaps: Gap[] = []
  let cursor = minutesOfDay(timed[0].end)

  for (let i = 1; i < timed.length; i++) {
    const start = minutesOfDay(timed[i].start)
    if (start - cursor >= MIN_GAP_MINUTES) {
      const midday = isMiddayGap(cursor, start)
      gaps.push({
        key: `gap-${cursor}-${start}`,
        start: cursor,
        end: start,
        midday,
        label: midday ? "Pause méridienne" : "Pause",
      })
    }
    cursor = Math.max(cursor, minutesOfDay(timed[i].end))
  }

  return gaps
}

export function concurrentGroups(courses: Course[]): TimedCourse[][] {
  const timed = courses.filter((c): c is TimedCourse => !!c.start && !!c.end)
  const groups: TimedCourse[][] = []
  let cursor = 0
  for (const course of timed.sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  )) {
    if (groups.length && minutesOfDay(course.start) < cursor) {
      groups.at(-1)!.push(course)
      cursor = Math.max(cursor, minutesOfDay(course.end))
    } else {
      groups.push([course])
      cursor = minutesOfDay(course.end)
    }
  }
  return groups
}

export function groupColumns(cluster: TimedCourse[]): TimedCourse[][] {
  const timed = [...cluster].sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime()
  )
  const columnEnds: number[] = []
  const columns: TimedCourse[][] = []

  for (const course of timed) {
    let col = columnEnds.findIndex((end) => end <= minutesOfDay(course.start))
    if (col === -1) {
      col = columnEnds.length
      columnEnds.push(minutesOfDay(course.end))
      columns.push([])
    } else {
      columnEnds[col] = minutesOfDay(course.end)
    }
    columns[col].push(course)
  }

  return columns
}

export function isHexColor(value?: string): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value)
}

export interface CourseFlag {
  key:
    | "cancelled"
    | "modified"
    | "online"
    | "evaluated"
    | "homework"
    | "session"
  label: string
  icon?: typeof GhostIcon
  tone: "destructive" | "warning" | "info" | "secondary"
}

export function courseFlags(course: Course): CourseFlag[] {
  const flags: CourseFlag[] = []
  if (course.cancelled) {
    flags.push({
      key: "cancelled",
      label: "Annulé",
      icon: GhostIcon,
      tone: "destructive",
    })
  } else {
    if (course.modified)
      flags.push({ key: "modified", label: "Modifié", tone: "warning" })
    if (course.status === "online")
      flags.push({
        key: "online",
        label: "Distanciel",
        icon: Video02Icon,
        tone: "secondary",
      })
    if (course.status === "evaluated")
      flags.push({
        key: "evaluated",
        label: "Évalué",
        icon: Award01Icon,
        tone: "warning",
      })
  }
  if (course.hasHomework)
    flags.push({
      key: "homework",
      label: "Devoir",
      icon: LibraryIcon,
      tone: "info",
    })
  if (course.hasLessonContent)
    flags.push({
      key: "session",
      label: "Séance",
      icon: Notebook01Icon,
      tone: "secondary",
    })
  return flags
}
