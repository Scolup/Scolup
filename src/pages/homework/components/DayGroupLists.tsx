import { Fragment, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useFirstVisit } from "@/hooks/useFirstVisit"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Assignment, DayGroup } from "../types"
import { type DayGroupProps, DayGroupSection } from "./DayGroupSection"

function CollapsedDayGroups({
  label,
  groups,
  pending,
  onToggle,
  onSelect,
}: {
  label: string
  groups: DayGroup[]
  pending: Set<string>
  onToggle: (assignment: Assignment) => void
  onSelect: (assignment: Assignment) => void
}) {
  const [open, setOpen] = useState(false)
  if (groups.length === 0) return null
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="px-4">
        <CollapsibleTrigger className="flex min-h-11 w-full press-lg items-center justify-between gap-3 rounded-2xl bg-input/50 px-3.5 py-3 text-left outline-none hover:bg-muted/70 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30">
          <span className="truncate text-sm font-semibold text-muted-foreground">
            {label}
          </span>
          <HugeiconsIcon
            icon={ChevronDownIcon}
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        {groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 && (
              <div className="px-4 py-4">
                <Separator className="opacity-60" />
              </div>
            )}
            <DayGroupSection
              group={group}
              pending={pending}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          </Fragment>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function OrderedGroups({
  groups,
  ...day
}: { groups: DayGroup[] } & DayGroupProps) {
  // Entrée animée seulement à la première ouverture de la session, et pour les
  // premiers devoirs seulement (voir ENTRANCE_CAP) : pas de flou ni de
  // conteneur animé, juste un léger décalage en transform/opacity.
  const animate = useFirstVisit("homework-list")
  let offset = 0

  return (
    <div className="pb-6">
      {groups.map((group, index) => {
        const start = offset
        offset += group.assignments.length
        return (
          <Fragment key={group.key}>
            {index > 0 && (
              <div className="px-4 py-4">
                <Separator className="opacity-60" />
              </div>
            )}
            <DayGroupSection
              group={group}
              offset={animate ? start : undefined}
              {...day}
            />
          </Fragment>
        )
      })}
    </div>
  )
}

export function ArchivedGroups({
  staleOverdue,
  staleLabel,
  pastDone,
  pastDoneLabel,
  ...day
}: {
  staleOverdue: DayGroup[]
  staleLabel: string
  pastDone: DayGroup[]
  pastDoneLabel: string
} & DayGroupProps) {
  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="px-4">
        <Separator className="opacity-60" />
      </div>
      <CollapsedDayGroups label={staleLabel} groups={staleOverdue} {...day} />
      <CollapsedDayGroups label={pastDoneLabel} groups={pastDone} {...day} />
    </div>
  )
}
