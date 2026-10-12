"use client"

import { cn } from "@/lib/utils"
import { coursesForDay, dayLabel } from "../helpers"
import { fullDateLabel, toDayKey, weekOf } from "@/services/dates"
import { DaySchedule } from "./DaySchedule"
import type { Course } from "../helpers"
import { FadeIn } from "@/ui/fade-in"

export function WeekView({
  date,
  courses,
  onSelect,
}: {
  date: Date
  courses: Course[]
  onSelect: (course: Course) => void
}) {
  const days = weekOf(date)
  const todayKey = toDayKey(new Date())

  return (
    <FadeIn className="flex flex-col gap-5 px-4 pt-3 pb-10">
      {days.map((day) => {
        const key = toDayKey(day)
        const dayCourses = coursesForDay(courses, key)
        const isToday = key === todayKey

        return (
          <section key={key} aria-label={fullDateLabel(day)}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-card-foreground">
                  {dayLabel(day)}
                  {isToday && (
                    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 align-middle text-[10px] font-semibold text-primary-text">
                      Aujourd&apos;hui
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {fullDateLabel(day)}
                  {dayCourses.length > 0 && ` · ${dayCourses.length} cours`}
                </span>
              </div>
            </div>

            {dayCourses.length === 0 ? (
              <p className="rounded-2xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
                Rien de prévu
              </p>
            ) : (
              <DaySchedule
                courses={dayCourses}
                showNow={isToday}
                onSelect={onSelect}
              />
            )}
          </section>
        )
      })}
    </FadeIn>
  )
}
