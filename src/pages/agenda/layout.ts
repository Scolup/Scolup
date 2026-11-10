import { minutesOfDay } from "@/lib/dates"
import type { Course, TimedCourse, Gap } from "./types"

const MIN_GAP_MINUTES = 10

export const SEPARATOR_MIN_MINUTES = 10

const MIDDAY_START_MINUTES = 11 * 60 + 30

const MIDDAY_END_MINUTES = 14 * 60

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
