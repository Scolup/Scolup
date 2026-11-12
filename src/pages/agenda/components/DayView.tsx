import { useEffect, useState } from "react"
import { formatTime, toDayKey } from "@/lib/dates"
import { DaySchedule } from "./DaySchedule"
import { resolveSubjectName } from "@/features/subjects/resolve"
import { useSubjects } from "@/features/subjects/store"
import type { Course } from "../types"

function useNow(active: boolean, intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
  return now
}

export function DayView({
  date,
  courses,
  onSelect,
}: {
  date: Date
  courses: Course[]
  onSelect: (course: Course) => void
}) {
  useSubjects()
  const untimed = courses.filter((course) => !course.start || !course.end)
  const isToday = toDayKey(date) === toDayKey(new Date())
  // Tick only: re-renders every 30 s so DaySchedule's "now" stays fresh.
  useNow(isToday)

  return (
    // No enter animation here: Agenda.tsx already slides the day on navigation.
    // No "next course" banner either: the card itself already carries the
    // "dans X min" pastille.
    <div className="flex flex-col gap-3 px-4 pt-4 pb-10">
      {untimed.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {untimed.map((course) => (
            <button
              key={course.key}
              type="button"
              onClick={() => onSelect(course)}
              className="flex press-lg items-center gap-2 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-card-foreground">
                {resolveSubjectName(course.subjectCode, course.title)}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {course.start || course.end
                  ? `${formatTime(course.start)} – ${formatTime(course.end)}`
                  : "Sans horaire"}
              </span>
            </button>
          ))}
        </div>
      )}

      <DaySchedule courses={courses} showNow={isToday} onSelect={onSelect} />
    </div>
  )
}
