import type { Period } from "../helpers"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar02Icon } from "@hugeicons/core-free-icons"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PeriodPicker({
  periods,
  selected,
  onSelect,
}: {
  periods: Period[]
  selected: string
  onSelect: (id: string) => void
}) {
  if (periods.length === 0) {
    return (
      <span className="text-sm font-semibold text-card-foreground">Notes</span>
    )
  }
  return (
    <Select
      value={selected}
      onValueChange={(value) => {
        if (value === null) return
        onSelect(value)
      }}
    >
      <SelectTrigger aria-label="Choisir la période" className="w-fit shrink-0">
        <SelectValue>
          {(value: string | null) => (
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Calendar02Icon}
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {periods.find((period) => period.id === value)?.label ??
                "Période"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              <HugeiconsIcon icon={Calendar02Icon} className="size-4" />
              {period.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
