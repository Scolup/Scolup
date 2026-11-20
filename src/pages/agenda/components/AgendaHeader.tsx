import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { SPRING_SOFT } from "@/lib/motion"
import { DateNavigator } from "@/components/DateNavigator"
import { dayLabel } from "../labels"
import { shortDayName, toDayKey, weekOf } from "@/lib/dates"
import type { AgendaView } from "../types"

interface AgendaHeaderProps {
  date: Date
  view: AgendaView
  onDateChange: (date: Date, dir?: number) => void
  onViewChange: (view: AgendaView) => void
}

function ViewSwitch({
  view,
  onViewChange,
  className,
  buttonClassName,
}: {
  view: AgendaView
  onViewChange: (view: AgendaView) => void
  className?: string
  buttonClassName?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Vue"
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full bg-input/50 p-0.5",
        className
      )}
    >
      {(["day", "week"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          onClick={() => {
            onViewChange(value)
          }}
          className={cn(
            "relative press rounded-full px-3 py-1 text-xs font-medium outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/30",
            buttonClassName,
            view === value
              ? "text-card-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {view === value && (
            <m.span
              layoutId="agenda-view-pill"
              transition={SPRING_SOFT}
              className="absolute inset-0 rounded-full bg-card shadow-sm"
              aria-hidden="true"
            />
          )}
          <span className="relative">
            {value === "day" ? "Jour" : "Semaine"}
          </span>
        </button>
      ))}
    </div>
  )
}

export function AgendaHeader({
  date,
  view,
  onDateChange,
  onViewChange,
}: AgendaHeaderProps) {
  const week = weekOf(date)
  const selectedKey = toDayKey(date)
  return (
    <div className="relative sticky top-0 z-20 flex flex-col gap-2 border-b border-border/60 px-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <DateNavigator
          date={date}
          view={view}
          dayTitle={dayLabel(date)}
          onDateChange={onDateChange}
        />

        <div className="flex shrink-0 items-center gap-1">
          <ViewSwitch
            view={view}
            onViewChange={onViewChange}
            className="hidden sm:flex"
          />
        </div>
      </div>

      <ViewSwitch
        view={view}
        onViewChange={onViewChange}
        className="w-full sm:hidden"
        buttonClassName="flex-1"
      />

      {view === "day" && (
        <div
          className="flex gap-0.5"
          role="tablist"
          aria-label="Jours de la semaine"
        >
          {week.map((day) => {
            const key = toDayKey(day)
            const isSelected = key === selectedKey
            const isDayToday = key === toDayKey(new Date())
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={dayLabel(day)}
                aria-current={isSelected ? "date" : undefined}
                onClick={() => onDateChange(day)}
                className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {shortDayName(day)}
                </span>
                <m.span
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full text-sm tabular-nums",
                    isSelected
                      ? "font-bold text-primary-foreground"
                      : isDayToday
                        ? "font-bold text-primary-text group-hover:bg-muted"
                        : "text-card-foreground group-hover:bg-muted"
                  )}
                >
                  {isSelected && (
                    <m.span
                      layoutId="agenda-day-pill"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                      className="absolute inset-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative">{day.getDate()}</span>
                </m.span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
