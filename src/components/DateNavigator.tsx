import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { fr } from "react-day-picker/locale/fr"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, fullDateLabel, isoWeekNumber, monthLabel } from "@/lib/dates"

export function DateNavigator({
  date,
  view,
  onDateChange,
  dayTitle,
}: {
  date: Date
  view: "day" | "week"
  onDateChange: (date: Date, dir?: number) => void
  dayTitle?: string
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const weekly = view === "week"
  const step = weekly ? 7 : 1

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        aria-label={weekly ? "Semaine précédente" : "Jour précédent"}
        onClick={() => onDateChange(addDays(date, -step), -1)}
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
              className="flex min-w-0 shrink-0 press cursor-pointer flex-col rounded-lg px-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          }
        >
          <span className="flex items-center gap-1 truncate text-sm font-semibold text-card-foreground">
            <HugeiconsIcon
              icon={Calendar03Icon}
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {weekly
              ? `Semaine ${isoWeekNumber(date)}`
              : (dayTitle ?? fullDateLabel(date))}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {weekly ? monthLabel(date) : fullDateLabel(date)}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            captionLayout="dropdown"
            defaultMonth={date}
            selected={date}
            onSelect={(next) => {
              if (!next) return
              onDateChange(
                new Date(next.getFullYear(), next.getMonth(), next.getDate())
              )
              setPickerOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        aria-label={weekly ? "Semaine suivante" : "Jour suivant"}
        onClick={() => onDateChange(addDays(date, step), 1)}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
      </Button>
    </div>
  )
}
