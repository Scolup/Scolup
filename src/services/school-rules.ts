// Pure "school life" logic: turns what Scolup knows about the student's school
// (homework, grades) into quest events. No React, no IndexedDB, so it can be
// unit-tested.
//
// Principles:
//   - Reward effort and progress, never an absolute grade: every grade quest
//     is relative to the student's OWN level.
//   - Prefer events that school data can confirm over self-reported ones.

import { dayKey, subjectId, weekKey, type QuestPayload } from "./quest-rules"

// ---- Homework ledger ---------------------------------------------------------
// The school only lists upcoming homework, so Scolup remembers what it saw
// (needed to know if a whole week was completed).

export interface LedgerEntry {
  d: string // due day key
  done: boolean
  test: boolean
  s: string // subject id
  n: string // subject name
  x?: boolean // already done before this sync: Scolup did not see it completed
}

export type Ledger = Record<string, LedgerEntry>

export interface HomeworkInput {
  id: number
  due: Date
  subject: string
  subjectCode?: string
  done: boolean
  isTest: boolean
}

const LEDGER_DAYS = 60

export function mergeLedger(
  ledger: Ledger,
  items: HomeworkInput[],
  now: Date,
  fromScolup = false
): Ledger {
  const next: Ledger = { ...ledger }
  for (const item of items) {
    const id = String(item.id)
    const previous = next[id]
    // Done before this sync (at first sight, or when it is unchecked) means
    // Scolup did not see it completed: ticking it again must never pay. Only a
    // tick that comes from Scolup itself can complete a homework here. The
    // flag is sticky, and also covers entries written before it existed.
    const outside = previous
      ? previous.done || previous.x === true
      : item.done && !fromScolup
    next[id] = {
      d: dayKey(item.due),
      done: item.done,
      test: item.isTest,
      s: subjectId(item.subjectCode, item.subject),
      n: item.subject,
      ...(outside ? { x: true } : {}),
    }
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - LEDGER_DAYS)
  const oldest = dayKey(cutoff)
  return Object.fromEntries(
    Object.entries(next).filter(([, entry]) => entry.d >= oldest)
  )
}

// Homework completed outside Scolup: quests must not reward ticking it here.
export function doneOutsideScolup(ledger: Ledger, id: string): boolean {
  return ledger[id]?.x === true
}

function weekBounds(monday: string): { from: string; to: string } {
  const end = new Date(`${monday}T12:00:00`)
  end.setDate(end.getDate() + 6)
  return { from: monday, to: dayKey(end) }
}

// A week is "complete" when it had at least 2 homeworks and all are done.
export function weekComplete(ledger: Ledger, monday: string): boolean {
  const { from, to } = weekBounds(monday)
  const entries = Object.values(ledger).filter(
    (entry) => entry.d >= from && entry.d <= to
  )
  return entries.length >= 2 && entries.every((entry) => entry.done)
}

export function previousWeekKey(now: Date): string {
  const date = new Date(now)
  date.setDate(date.getDate() - 7)
  return weekKey(date)
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00`)
  date.setDate(date.getDate() + days)
  return dayKey(date)
}

// The ledger keeps about 8 weeks, so a longer streak cannot be proven anyway.
const MAX_STREAK_WEEKS = 8

// Consecutive complete weeks ending at `monday` (that week included).
// ponytail: a week with fewer than 2 homeworks (holidays) breaks the streak.
// Upgrade path: skip weeks the school gave nothing, once the ledger can tell
// "no homework" from "the app was not opened".
export function completeStreak(ledger: Ledger, monday: string): number {
  let streak = 0
  let week = monday
  while (streak < MAX_STREAK_WEEKS && weekComplete(ledger, week)) {
    streak++
    week = addDays(week, -7)
  }
  return streak
}

// ---- Grades ---------------------------------------------------------------------

export interface GradeInput {
  key: string
  subject: string
  subjectCode?: string
  value: string
  outOf: string
  coef: string
  period: string
  date?: Date
  enteredOn?: Date
  nonSignificant: boolean
}

export interface GradeLite {
  key: string
  subject: string // subject id
  name: string
  ratio: number | null // grade / scale (0..1); null = absent, not graded
  coef: number
  period: string
  time: number
}

function parseNumber(text: string): number | null {
  const value = Number(text.replace(",", ".").trim())
  return text.trim() !== "" && Number.isFinite(value) ? value : null
}

export function toGradeLite(grade: GradeInput): GradeLite {
  const value = parseNumber(grade.value)
  const scale = parseNumber(grade.outOf)
  const coef = parseNumber(grade.coef)
  const when = grade.date ?? grade.enteredOn
  return {
    key: grade.key,
    subject: subjectId(grade.subjectCode, grade.subject),
    name: grade.subject,
    ratio:
      grade.nonSignificant || value === null || scale === null || scale <= 0
        ? null
        : value / scale,
    coef: coef !== null && coef > 0 ? coef : 1,
    period: grade.period,
    time: when ? when.getTime() : 0,
  }
}

const MAX_SEEN_GRADES = 400

// Which grades are new? The very first time (seen === null) everything that
// already exists is just remembered: nobody gets paid for old grades.
export function newGrades(
  grades: GradeLite[],
  seen: string[] | null
): { fresh: GradeLite[]; seen: string[] } {
  const keys = grades.map((grade) => grade.key)
  if (seen === null) return { fresh: [], seen: keys.slice(-MAX_SEEN_GRADES) }
  const known = new Set(seen)
  const fresh = grades
    .filter((grade) => !known.has(grade.key))
    .sort((a, b) => a.time - b.time)
  return {
    fresh,
    seen: [...seen, ...fresh.map((grade) => grade.key)].slice(-MAX_SEEN_GRADES),
  }
}

const MIN_GRADES_FOR_AVERAGE = 2

// Event details of a new grade, always relative to the student's own level:
//   improved  strictly better than the previous graded evaluation (same subject)
//   delta     how much better (or worse) than that one
//   aboveAvg  gap to the average of the earlier grades of that subject in the
//             same period (needs at least 2 of them to mean something)
export function gradePayload(
  grade: GradeLite,
  all: GradeLite[]
): QuestPayload | null {
  const ratio = grade.ratio
  if (ratio === null) return null // absent / not graded: no event
  const earlier = all
    .filter(
      (other): other is GradeLite & { ratio: number } =>
        other.subject === grade.subject &&
        other.ratio !== null &&
        other.key !== grade.key &&
        other.time < grade.time
    )
    .sort((a, b) => b.time - a.time)
  const previous = earlier[0]
  const payload: QuestPayload = {
    subject: grade.subject,
    ratio,
    improved: previous !== undefined && ratio > previous.ratio,
  }
  if (previous !== undefined) payload.delta = ratio - previous.ratio

  const samePeriod = earlier.filter((other) => other.period === grade.period)
  if (samePeriod.length >= MIN_GRADES_FOR_AVERAGE) {
    const total = samePeriod.reduce((sum, other) => sum + other.coef, 0)
    const average =
      samePeriod.reduce((sum, other) => sum + other.ratio * other.coef, 0) /
      total
    payload.aboveAvg = ratio - average
  }
  return payload
}
