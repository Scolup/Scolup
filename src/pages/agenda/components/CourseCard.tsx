import type { CSSProperties } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, User02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useSubjectDisplay } from "@/services/subjects"
import {
  countdownLabel,
  courseFlags,
  isHexColor,
  isOngoing,
  type Course,
  type CourseFlag,
} from "../helpers"

const textTone =
  "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]"

const pillTones: Record<CourseFlag["tone"], string> = {
  destructive: "bg-destructive/15 text-destructive",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  secondary: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
}

const surfaces = {
  cancelled:
    "border-destructive/30 bg-destructive/[0.07] dark:bg-destructive/[0.12]",
  tinted:
    "border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_13%,var(--card))] dark:bg-[color-mix(in_srgb,var(--c)_20%,var(--card))]",
  plain: "border-border/70 bg-card",
}

function cardStyle(
  course: Course,
  color: string,
  now: Date | null,
  isNext: boolean
) {
  const hex = isHexColor(color)
  const minutes =
    course.start && course.end
      ? Math.round((course.end.getTime() - course.start.getTime()) / 60_000)
      : null
  const ongoing = now !== null && isOngoing(course, now)
  const style: CSSProperties = hex ? ({ "--c": color } as CSSProperties) : {}
  if (minutes) {
    style.minHeight = Math.round(minutes * (76 / 55))
    style.flexGrow = minutes
  }
  const surface = course.cancelled
    ? surfaces.cancelled
    : hex
      ? surfaces.tinted
      : surfaces.plain

  return {
    ongoing,
    style,
    surface,
    stripe: course.cancelled
      ? "bg-destructive/70"
      : hex
        ? "bg-[var(--c)]"
        : "bg-border",
    compact: minutes !== null && minutes < 45,
    tone: course.cancelled
      ? "text-muted-foreground"
      : hex
        ? textTone
        : "text-card-foreground",
    nowBadge: ongoing
      ? "En cours"
      : isNext && now && course.start
        ? countdownLabel(now, course.start)
        : null,
  }
}

function Badges({
  course,
  nowBadge,
  ongoing,
}: {
  course: Course
  nowBadge: string | null
  ongoing: boolean
}) {
  const flags = courseFlags(course).filter((flag) => flag.key !== "session")
  if (!nowBadge && flags.length === 0) return null

  return (
    <span className="flex flex-wrap gap-1 pt-0.5">
      {nowBadge && (
        <span
          className={cn(
            "rounded-full px-2 py-px text-[11px] font-semibold",
            ongoing
              ? "bg-primary text-primary-foreground"
              : "bg-primary/15 text-primary-text"
          )}
        >
          {nowBadge}
        </span>
      )}
      {flags.map((flag) => (
        <span
          key={flag.key}
          className={cn(
            "rounded-full px-2 py-px text-[11px] font-semibold",
            pillTones[flag.tone],
            flag.icon && "flex items-center gap-1"
          )}
        >
          {flag.icon && (
            <HugeiconsIcon
              icon={flag.icon}
              className="size-3"
              aria-hidden="true"
            />
          )}
          {flag.label}
        </span>
      ))}
    </span>
  )
}

function Meta({ course, tone }: { course: Course; tone: string }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-[13px] font-semibold opacity-80",
        tone
      )}
    >
      {course.room && (
        <span className="flex min-w-0 items-center gap-1">
          <HugeiconsIcon
            icon={Location01Icon}
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{course.room}</span>
        </span>
      )}
      {course.room && course.teacher && (
        <span
          aria-hidden="true"
          className="h-5 w-0.5 shrink-0 rounded-full bg-current opacity-40"
        />
      )}
      {course.teacher && (
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <HugeiconsIcon
            icon={User02Icon}
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{course.teacher}</span>
        </span>
      )}
    </span>
  )
}

export function CourseCard({
  course,
  now,
  isNext,
  onSelect,
}: {
  course: Course
  now: Date | null
  isNext: boolean
  onSelect: (course: Course) => void
}) {
  const { display, color } = useSubjectDisplay(course.subjectCode, course.title)
  const card = cardStyle(course, color, now, isNext)
  const showMeta = !card.compact && Boolean(course.room || course.teacher)
  const showDetails =
    !card.compact && Boolean(course.details) && !course.cancelled

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(course)
      }}
      style={card.style}
      className={cn(
        "flex min-w-0 items-stretch gap-3 rounded-2xl border p-3.5 text-left outline-none",
        "transition duration-200 active:scale-[0.99]",
        "hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/50",
        card.surface
      )}
    >
      <span
        aria-hidden="true"
        className={cn("w-1.5 shrink-0 self-stretch rounded-full", card.stripe)}
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span
          className={cn(
            "leading-snug font-bold",
            card.compact ? "truncate text-[15px]" : "line-clamp-2 text-[15px]",
            course.cancelled
              ? "text-destructive line-through decoration-destructive/60"
              : card.tone
          )}
        >
          {display}
        </span>

        {showMeta && <Meta course={course} tone={card.tone} />}

        {showDetails && (
          <span className="truncate text-xs text-muted-foreground">
            {course.details}
          </span>
        )}

        <Badges
          course={course}
          nowBadge={card.nowBadge}
          ongoing={card.ongoing}
        />
      </span>
    </button>
  )
}
