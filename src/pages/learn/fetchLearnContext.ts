import { fetchGrades } from "@/features/grades/fetchGrades"
import { addDays, toDayKey, weekOf } from "@/lib/dates"
import { htmlToText } from "@/lib/html"
import { normalizeTimetable } from "@/pages/agenda/normalize"
import { fetchDayEntries } from "@/pages/homework/fetchDayEntries"
import { normalizeCalendar } from "@/pages/homework/mappers"
import { ld } from "@/services/litedirecte"
import { getSetting } from "@/services/storage"
import { levelFromClass } from "./curriculum"
import type { SchoolSignal } from "./ranking"

export async function fetchLearnIdentity() {
  if (!(await ld.auth.loadSession())) return null
  const account = ld.auth.getAccount()
  if (!account) return null
  const schoolClass = account.profile?.classe
  const level =
    levelFromClass(schoolClass?.libelle ?? "") ??
    levelFromClass(schoolClass?.code ?? "")
  const saved = level
    ? undefined
    : await getSetting(`learn-level:${account.id}`).catch(() => undefined)
  return {
    id: String(account.id),
    level,
    savedLevel: typeof saved === "string" ? levelFromClass(saved) : undefined,
  }
}

function textOf(value: unknown): string {
  return typeof value === "string"
    ? htmlToText(value).replace(/\s+/gu, " ").slice(0, 600)
    : ""
}

export async function fetchLearnContext(
  accountId: string
): Promise<SchoolSignal[]> {
  if (String(ld.auth.getAccount()?.id) !== accountId) return []
  const now = new Date()
  const today = toDayKey(now)
  const weeks = [weekOf(now), weekOf(addDays(now, -7))]
  const [homework, grades, ...timetables] = await Promise.allSettled([
    ld.homework.getHomework().then(normalizeCalendar),
    fetchGrades(),
    ...weeks.map((week) =>
      ld.timetable
        .getTimetable({
          startDate: toDayKey(week[0]),
          endDate: toDayKey(week[6]),
        })
        .then(normalizeTimetable)
    ),
  ] as const)
  const assignments = homework.status === "fulfilled" ? homework.value : []
  const courses = timetables.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  )
  const lessonDays = [
    ...new Set(
      courses.flatMap((course) =>
        course.start &&
        course.start <= now &&
        !course.cancelled &&
        course.hasLessonContent
          ? [toDayKey(course.start)]
          : []
      )
    ),
  ]
    .sort()
    .reverse()
    .slice(0, 3)
  const homeworkDays = [
    ...new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.dueKey >= today &&
            assignment.dueKey <= toDayKey(addDays(now, 7))
        )
        .map((assignment) => assignment.dueKey)
    ),
  ]
    .sort()
    .slice(0, 3)
  const days = [...new Set([...lessonDays, ...homeworkDays])]
  const signals: SchoolSignal[] = []
  const add = (
    kind: SchoolSignal["kind"],
    subject: string,
    value: unknown,
    weight: number
  ) => {
    const text = textOf(value)
    if (
      text &&
      !signals.some(
        (signal) =>
          signal.kind === kind &&
          signal.subject === subject &&
          signal.text === text
      )
    ) {
      signals.push({ kind, subject, text, weight })
    }
  }
  for (const assignment of assignments) {
    if (homeworkDays.includes(assignment.dueKey))
      add(
        "homework",
        assignment.subject,
        assignment.content,
        assignment.done ? 2 : 3
      )
  }
  for (let index = 0; index < days.length; index += 2) {
    if (String(ld.auth.getAccount()?.id) !== accountId) return []
    const batch = days.slice(index, index + 2)
    const results = await Promise.allSettled(batch.map(fetchDayEntries))
    for (const [offset, result] of results.entries()) {
      if (result.status !== "fulfilled") continue
      const day = batch[offset]
      if (homeworkDays.includes(day)) {
        for (const assignment of normalizeCalendar({ [day]: result.value })) {
          add(
            "homework",
            assignment.subject,
            assignment.content,
            assignment.done ? 2 : 3
          )
        }
      }
      if (lessonDays.includes(day)) {
        for (const entry of result.value) {
          const detail = entry.contenuDeSeance as
            | { contenu?: unknown }
            | undefined
          if (typeof entry.matiere === "string")
            add("lesson", entry.matiere, detail?.contenu, 3)
        }
      }
    }
  }
  if (grades.status === "fulfilled") {
    for (const grade of grades.value.grades) {
      const date = grade.date ?? grade.enteredOn
      if (date && date >= addDays(now, -30) && date <= now) {
        add("grade", grade.subject, grade.title, 0.75)
      }
    }
  }
  if (String(ld.auth.getAccount()?.id) !== accountId) return []
  return [
    ...signals.filter((signal) => signal.kind === "lesson").slice(0, 8),
    ...signals.filter((signal) => signal.kind === "homework").slice(0, 8),
    ...signals.filter((signal) => signal.kind === "grade").slice(0, 4),
  ]
}
