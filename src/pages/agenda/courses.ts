import { toDayKey } from "@/lib/dates"
import type { Course } from "./types"

function courseDayKey(course: Course): string {
  return course.start ? toDayKey(course.start) : ""
}

export function coursesForDay(courses: Course[], key: string): Course[] {
  return courses.filter((course) => courseDayKey(course) === key)
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

export function isHexColor(value?: string): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value)
}
