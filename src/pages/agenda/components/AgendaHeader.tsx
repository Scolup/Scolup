"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { fr } from "react-day-picker/locale/fr"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { dayLabel } from "../helpers"
import {
  addDays,
  fullDateLabel,
  isoWeekNumber,
  monthLabel,
  shortDayName,
  toDayKey,
  weekOf,
} from "@/services/dates"
import type { AgendaView } from "../helpers"

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
            "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/30",
            buttonClassName,
            view === value
              ? "bg-card text-card-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {value === "day" ? "Jour" : "Semaine"}
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
  const step = view === "week" ? 7 : 1
  const [pickerOpen, setPickerOpen] = useState(false)

  const go = (next: Date, dir?: number) => {
    onDateChange(next, dir)
  }

  const pickDate = (next: Date | undefined) => {
    if (!next) return
    go(new Date(next.getFullYear(), next.getMonth(), next.getDate()))
    setPickerOpen(false)
  }

  return (
    <div className="sticky top-0 z-20 flex flex-col gap-2 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            aria-label={
              view === "week" ? "Semaine précédente" : "Jour précédent"
            }
            onClick={() => go(addDays(date, -step), -1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label="Choisir une date"
                  title="Choisir une date"
                  className="flex min-w-0 shrink-0 cursor-pointer flex-col rounded-lg px-1 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              }
            >
              <span className="flex items-center gap-1 truncate text-sm font-semibold text-card-foreground">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {view === "week"
                  ? "Semaine " + isoWeekNumber(date)
                  : dayLabel(date)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {view === "day" ? fullDateLabel(date) : monthLabel(date)}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={fr}
                captionLayout="dropdown"
                selected={date}
                onSelect={pickDate}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            aria-label={view === "week" ? "Semaine suivante" : "Jour suivant"}
            onClick={() => go(addDays(date, step), 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Button>
        </div>

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
                onClick={() => go(day)}
                className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {shortDayName(day)}
                </span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors duration-200",
                    isSelected
                      ? "bg-primary font-bold text-primary-foreground group-hover:bg-primary/80"
                      : isDayToday
                        ? "font-bold text-primary-text group-hover:bg-muted"
                        : "text-card-foreground group-hover:bg-muted"
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
