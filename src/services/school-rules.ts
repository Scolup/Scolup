// Pure "school life" logic: turns what Scolup knows about the student's school
// (homework, grades) into quest events and into the personalised weekly
// contract. No React, no IndexedDB, so it can be unit-tested.
//
// Principles:
//   - Reward effort and progress, never an absolute grade: every grade quest
//     is relative to the student's OWN level.
//   - Prefer events that school data can confirm over self-reported ones.

import {
  dayKey,
  subjectId,
  weekKey,
  type QuestDef,
  type QuestPayload,
} from "./quest-rules"

// ---- Homework ledger ---------------------------------------------------------
// The school only lists upcoming homework, so Scolup remembers what it saw
// (needed to know if a whole week was completed).

export interface LedgerEntry {
  d: string // due day key
  done: boolean
  test: boolean
  s: string // subject id
  n: string // subject name
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
  now: Date
): Ledger {
  const next: Ledger = { ...ledger }
  for (const item of items) {
    next[String(item.id)] = {
      d: dayKey(item.due),
      done: item.done,
      test: item.isTest,
      s: subjectId(item.subjectCode, item.subject),
      n: item.subject,
    }
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - LEDGER_DAYS)
  const oldest = dayKey(cutoff)
  return Object.fromEntries(
    Object.entries(next).filter(([, entry]) => entry.d >= oldest)
  )
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

// Event details of a new grade. `improved` = at least as good as the previous
// graded evaluation of the same subject.
export function gradePayload(
  grade: GradeLite,
  all: GradeLite[]
): QuestPayload | null {
  if (grade.ratio === null) return null // absent / not graded: no event
  const previous = all
    .filter(
      (other) =>
        other.subject === grade.subject &&
        other.ratio !== null &&
        other.key !== grade.key &&
        other.time < grade.time
    )
    .sort((a, b) => b.time - a.time)[0]
  return {
    subject: grade.subject,
    ratio: grade.ratio,
    improved:
      previous !== undefined &&
      previous.ratio !== null &&
      grade.ratio >= previous.ratio,
  }
}

export interface Weakest {
  id: string
  name: string
  average: number // 0..20
  ratio: number // 0..1
}

// The student's most fragile subject (current period, at least 2 grades).
export function weakestSubject(grades: GradeLite[]): Weakest | null {
  const graded = grades.filter((grade) => grade.ratio !== null)
  if (graded.length === 0) return null
  const latest = [...graded].sort((a, b) => b.time - a.time)[0]
  const groups = new Map<string, GradeLite[]>()
  for (const grade of graded) {
    if (grade.period !== latest.period) continue
    groups.set(grade.subject, [...(groups.get(grade.subject) ?? []), grade])
  }
  let weakest: Weakest | null = null
  for (const [id, list] of groups) {
    if (list.length < 2) continue
    const total = list.reduce((sum, grade) => sum + grade.coef, 0)
    const ratio =
      list.reduce((sum, grade) => sum + (grade.ratio ?? 0) * grade.coef, 0) /
      total
    if (weakest === null || ratio < weakest.ratio) {
      weakest = {
        id,
        name: list[0].name,
        average: Math.round(ratio * 200) / 10,
        ratio,
      }
    }
  }
  return weakest
}

// ---- Weekly contract ----------------------------------------------------------

export interface ContractContext {
  week: string // Monday key
  homeworkThisWeek: number
  tests: { id: string; name: string; day: string }[] // this week, not past
  weakest: Weakest | null // null when grade quests are turned off
  hideGrades: boolean
}

export function contractContext(
  ledger: Ledger,
  weakest: Weakest | null,
  hideGrades: boolean,
  now: Date
): ContractContext {
  const week = weekKey(now)
  const { from, to } = weekBounds(week)
  const today = dayKey(now)
  const entries = Object.values(ledger).filter(
    (entry) => entry.d >= from && entry.d <= to
  )
  return {
    week,
    homeworkThisWeek: entries.length,
    tests: entries
      .filter((entry) => entry.test && entry.d >= today)
      .sort((a, b) => a.d.localeCompare(b.d))
      .map((entry) => ({ id: entry.s, name: entry.n, day: entry.d })),
    weakest: hideGrades ? null : weakest,
    hideGrades,
  }
}

// Regenerate the contract only if what it is built from changed.
export function contractHash(ctx: ContractContext): string {
  return [
    ctx.week,
    ctx.homeworkThisWeek,
    ctx.tests.map((test) => `${test.id}@${test.day}`).join(","),
    ctx.weakest?.id ?? "",
    ctx.hideGrades ? "h" : "",
  ].join("|")
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00`)
  date.setDate(date.getDate() + days)
  return dayKey(date)
}

// Up to personalised quests for the week. Ids contain the week, so each
// week starts fresh and last week's can be dropped.
export function generateContract(ctx: ContractContext): QuestDef[] {
  const { week } = ctx
  const sunday = addDays(week, 6)
  const quests: QuestDef[] = []

  // 1. Homework on time (all homework this week).
  const goal = ctx.homeworkThisWeek
  if (goal > 0) {
    quests.push({
      id: `contract:${week}:ontime`,
      title: "Tout rendre à l'heure",
      description: `Rendre tous les devoirs (${goal}) à l'heure cette semaine`,
      reward: 25,
      event: "homework-ontime",
      goal,
      unique: true,
      period: "weekly",
      expires: sunday,
      generated: true,
    })
  }

  // Devoirs en avance
  if (goal >= 2) {
    quests.push({
      id: `contract:${week}:early`,
      title: "Devoirs en avance",
      description: "Cocher 2 devoirs avant le jour de rendu cette semaine",
      reward: 20,
      event: "homework-early",
      goal: 2,
      unique: true,
      period: "weekly",
      expires: sunday,
      generated: true,
    })
  }

  return quests
}
