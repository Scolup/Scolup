import { Fragment } from "react"
import { formatTime, minutesOfDay } from "@/services/dates"
import {
  buildGaps,
  concurrentGroups,
  groupColumns,
  nextCourse,
  SEPARATOR_MIN_MINUTES,
  type Course,
  type Gap,
  type TimedCourse,
} from "../helpers"
import { CourseCard } from "./CourseCard"
import { GapSeparator } from "./GapSeparator"

const PX_PER_MIN = 76 / 55

function TimeGutter({ start, end }: { start: Date; end: Date }) {
  return (
    <span className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 tabular-nums">
      <span className="text-[13px] font-bold text-card-foreground">
        {formatTime(start)}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {formatTime(end)}
      </span>
    </span>
  )
}

function TimeSpacer({ minutes }: { minutes: number }) {
  if (minutes <= 0) return null
  return <div aria-hidden="true" style={{ height: minutes * PX_PER_MIN }} />
}

function longGaps(courses: TimedCourse[]): Map<number, Gap> {
  return new Map(
    buildGaps(courses)
      .filter((gap) => gap.end - gap.start >= SEPARATOR_MIN_MINUTES)
      .map((gap) => [gap.end, gap])
  )
}

function CourseCluster({
  courses,
  now,
  nextKey,
  onSelect,
}: {
  courses: TimedCourse[]
  now: Date | null
  nextKey: string | null
  onSelect: (course: Course) => void
}) {
  const columns = groupColumns(courses)
  const base = minutesOfDay(courses[0].start)
  const start = courses.reduce(
    (earliest, course) => (course.start < earliest ? course.start : earliest),
    courses[0].start
  )
  const end = courses.reduce(
    (latest, course) => (course.end > latest ? course.end : latest),
    courses[0].end
  )

  return (
    <div className="flex w-full gap-2.5">
      <TimeGutter start={start} end={end} />
      <div className="flex min-w-0 flex-1 gap-2.5">
        {columns.map((column, ci) => {
          const pauses = longGaps(column)
          return (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <TimeSpacer minutes={minutesOfDay(column[0].start) - base} />
              {column.map((course, i) => {
                const pause =
                  i > 0 ? pauses.get(minutesOfDay(course.start)) : undefined
                const silent =
                  i > 0 && !pause
                    ? minutesOfDay(course.start) -
                      minutesOfDay(column[i - 1].end)
                    : 0
                return (
                  <Fragment key={course.key}>
                    {pause && <GapSeparator bare gap={pause} />}
                    <TimeSpacer minutes={silent} />
                    <CourseCard
                      course={course}
                      now={now}
                      isNext={course.key === nextKey}
                      onSelect={onSelect}
                    />
                  </Fragment>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DaySchedule({
  courses,
  showNow,
  onSelect,
}: {
  courses: Course[]
  showNow?: boolean
  onSelect: (course: Course) => void
}) {
  const now = showNow ? new Date() : null
  const groups = concurrentGroups(courses)
  const timed = groups.flat()
  const nextKey = now ? (nextCourse(timed, now)?.key ?? null) : null
  const separators = longGaps(timed)

  return (
    <ol className="flex flex-col gap-1.5">
      {groups.map((group) => {
        const separator = separators.get(minutesOfDay(group[0].start))
        return (
          <Fragment key={group[0].key}>
            {separator && (
              <li>
                <GapSeparator gap={separator} />
              </li>
            )}
            <li>
              <CourseCluster
                courses={group}
                now={now}
                nextKey={nextKey}
                onSelect={onSelect}
              />
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
