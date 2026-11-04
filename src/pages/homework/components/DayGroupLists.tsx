import { Fragment, useState } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { staggerContainer } from "@/lib/motion"
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
        <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-input/50 px-3.5 py-3 text-left transition-colors duration-200 outline-none hover:bg-muted/70 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30">
          <span className="truncate text-sm font-semibold text-muted-foreground">
            {label}
          </span>
          <HugeiconsIcon
            icon={ChevronDownIcon}
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
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
  return (
    <m.div
      initial={{ filter: "blur(6px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.15, 1] }}
      className="pb-6"
    >
      <m.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.035, 0.05)}
      >
        {groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 && (
              <div className="px-4 py-4">
                <Separator className="opacity-60" />
              </div>
            )}
            <DayGroupSection group={group} {...day} />
          </Fragment>
        ))}
      </m.div>
    </m.div>
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
