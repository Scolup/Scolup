import { toDayKey } from "@/services/dates"
import type { Course } from "@/pages/agenda/helpers"

export interface NextDaySlice {
  key: string
  date: Date
  list: Course[]
}

// Le prochain jour avec des cours à venir : aujourd'hui s'il en reste,
// sinon le jour suivant dans la semaine chargée.
export function nextDayWithCourses(
  courses: Course[],
  now = new Date()
): NextDaySlice | null {
  const nowTime = now.getTime()
  const upcoming = courses
    .filter(
      (course) =>
        !course.cancelled &&
        course.start &&
        course.end &&
        course.end.getTime() > nowTime
    )
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
  if (upcoming.length === 0) return null
  const first = upcoming[0].start as Date
  const key = toDayKey(first)
  const list = upcoming
    .filter((course) => course.start && toDayKey(course.start) === key)
    .slice(0, 3)
  if (list.length === 0) return null
  return { key, date: list[0].start as Date, list }
}
