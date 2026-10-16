"use client"

import { useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { resolveSubjectName } from "@/services/subjects"
import { courseRelativeLabel, dayLabel } from "@/pages/agenda/helpers"
import { formatTime, toDayKey, weekOf } from "@/services/dates"
import { nextDayWithCourses } from "@/pages/home/helpers"
import { useAgenda } from "@/pages/agenda/hooks/useAgenda"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { WidgetSkeleton } from "@/pages/home/components/WidgetSkeleton"
import { WidgetEmpty, WidgetError } from "@/pages/home/components/WidgetState"
import { useSplashTask } from "@/services/splash"

export function NextCoursesWidget() {
  const navigate = useNavigate()
  const week = useMemo(() => weekOf(new Date()), [])
  const startKey = toDayKey(week[0])
  const endKey = toDayKey(week[6])
  const { courses, loading, error, refresh } = useAgenda(startKey, endKey)

  useSplashTask(loading)
  const showSkeleton = useDelayedLoading(loading)

  const day = useMemo(() => nextDayWithCourses(courses), [courses])
  const firstLabel = day ? courseRelativeLabel(day.list[0]) : null

  if (error) return <WidgetError onRetry={refresh} />
  if (loading && courses.length === 0) {
    if (!showSkeleton) {
      return (
        <section
          aria-hidden="true"
          className="min-h-[76px] rounded-3xl border border-border/70 bg-card"
        />
      )
    }
    return <WidgetSkeleton rows={3} />
  }
  if (!day)
    return (
      <WidgetEmpty
        icon={Calendar03Icon}
        title="Aucun cours à venir"
        hint="Profite de ta pause."
      />
    )

  return (
    <section
      aria-label={dayLabel(day.date)}
      className="flex flex-col gap-1.5 rounded-3xl border border-border/70 bg-card p-4"
    >
      <button
        type="button"
        onClick={() => navigate(`/agenda?date=${day.key}`)}
        className="flex min-h-11 items-center justify-between gap-2 rounded-2xl px-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="truncate text-sm font-semibold text-card-foreground">
          {dayLabel(day.date)}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {firstLabel ?? `${day.list.length} cours`}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4"
            aria-hidden="true"
          />
        </span>
      </button>
      {day.list.map((course) => (
        <button
          key={course.key}
          type="button"
          onClick={() => navigate(`/agenda?date=${day.key}`)}
          className="flex min-h-12 items-center gap-3 rounded-2xl bg-input/50 px-3.5 py-2.5 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex shrink-0 flex-col items-center tabular-nums">
            <span className="text-xs font-bold text-card-foreground">
              {course.start ? formatTime(course.start) : ""}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {course.end ? formatTime(course.end) : ""}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="w-1 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: course.color ?? "var(--muted)" }}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {resolveSubjectName(course.subjectCode, course.title)}
            </span>
            {(course.room || course.teacher) && (
              <span className="truncate text-xs text-muted-foreground">
                {[course.room, course.teacher ?? null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </span>
        </button>
      ))}
    </section>
  )
}
