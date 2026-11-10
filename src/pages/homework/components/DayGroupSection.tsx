import { cn } from "@/lib/utils"
import { HomeworkEntry } from "./HomeworkEntry"
import { dayLabel } from "../labels"
import { daysUntil } from "@/lib/dates"
import type { Assignment, DayGroup } from "../types"

export function DayGroupSection({
  group,
  pending,
  onToggle,
  onSelect,
}: {
  group: DayGroup
  pending: Set<string>
  onToggle: (assignment: Assignment) => void
  onSelect: (assignment: Assignment) => void
}) {
  const overdue =
    daysUntil(group.date) < 0 && group.assignments.some((a) => !a.done)
  return (
    <section>
      <h2 className="flex items-baseline gap-2 px-4 pt-3 pb-1">
        <span
          className={cn(
            "text-sm font-semibold",
            overdue ? "text-destructive" : "text-card-foreground"
          )}
        >
          {dayLabel(group.date)}
        </span>
      </h2>
      {group.assignments.map((assignment) => (
        <HomeworkEntry
          key={assignment.key}
          assignment={assignment}
          pending={pending.has(assignment.key)}
          onToggle={() => onToggle(assignment)}
          onSelect={onSelect}
        />
      ))}
    </section>
  )
}

export interface DayGroupProps {
  pending: Set<string>
  onToggle: (assignment: Assignment) => void
  onSelect: (assignment: Assignment) => void
}
