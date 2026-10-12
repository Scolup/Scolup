import { Fragment, useMemo, useState } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  ChevronDownIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { staggerContainer } from "@/hooks/use-micro-interactions"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { HomeworkEntry } from "./HomeworkEntry"
import { dayLabel, summarizeGroups } from "../helpers"
import { daysUntil } from "@/services/dates"
import type { Assignment, DayGroup } from "../helpers"
import { InlineError } from "@/ui/inline-error"
import { EmptyState } from "@/ui/empty-state"
import { ProgressRing } from "@/ui/progress-ring"
import { FadeIn } from "@/ui/fade-in"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
const skeletonDays = [2, 3, 1]
const skeletonDayWidths = ["w-28", "w-36", "w-24"]
const SUBJECT_WIDTHS = ["w-20", "w-28", "w-24", "w-16", "w-24"]

function HomeworkListSkeleton() {
  return (
    <div aria-hidden="true" className="pb-6">
      {skeletonDays.map((rows, day) => (
        <Fragment key={day}>
          {day > 0 && (
            <div className="px-4 py-4">
              <Separator className="opacity-60" />
            </div>
          )}
          <div className="px-4 pt-3 pb-1">
            <Skeleton
              className={cn("h-4 rounded-full", skeletonDayWidths[day])}
            />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-1.5">
              <div className="flex items-center gap-3 rounded-2xl border border-transparent bg-input/50 px-3.5 py-3">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton
                    className={cn(
                      "h-3.5 rounded-full",
                      SUBJECT_WIDTHS[(day * 3 + i) % SUBJECT_WIDTHS.length]
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}

interface HomeworkListProps {
  groups: DayGroup[]
  loading: boolean
  error: string | null
  onRetry: () => void
  pending: Set<string>
  onToggle: (assignment: Assignment) => void
  onSelect: (assignment: Assignment) => void
}

function DayGroupSection({
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
export function HomeworkList(props: HomeworkListProps) {
  const summary = useMemo(() => summarizeGroups(props.groups), [props.groups])

  return (
    <div className="flex min-h-[50dvh] w-full flex-col gap-0">
      <HomeworkRows
        summary={summary}
        loading={props.loading}
        error={props.error}
        onRetry={props.onRetry}
        pending={props.pending}
        onToggle={props.onToggle}
        onSelect={props.onSelect}
      />

      {!props.loading &&
        !props.error &&
        (summary.staleOverdue.length > 0 || summary.pastDone.length > 0) && (
          <>
            {summary.ordered.length === 0 && (
              <EmptyState
                icon={CheckmarkCircle02Icon}
                title="Rien à faire pour le moment"
                description="Tes devoirs à venir apparaîtront ici."
              />
            )}
            <ArchivedGroups
              staleOverdue={summary.staleOverdue}
              staleLabel={summary.staleLabel}
              pastDone={summary.pastDone}
              pastDoneLabel={summary.pastDoneLabel}
              pending={props.pending}
              onToggle={props.onToggle}
              onSelect={props.onSelect}
            />
          </>
        )}
    </div>
  )
}

type DayGroupProps = Pick<
  HomeworkListProps,
  "pending" | "onToggle" | "onSelect"
>

type GroupSummary = ReturnType<typeof summarizeGroups>

function HomeworkRows({
  summary,
  loading,
  error,
  onRetry,
  pending,
  onToggle,
  onSelect,
}: {
  summary: GroupSummary
  loading: boolean
  error: string | null
  onRetry: () => void
} & DayGroupProps) {
  const showSkeleton = useDelayedLoading(loading)
  if (loading) return showSkeleton ? <HomeworkListSkeleton /> : null
  if (error) return <InlineError message={error} onRetry={onRetry} />
  if (summary.nothingToDo) {
    return (
      <EmptyState
        media={<ProgressRing value={1} label="Aucun devoir à faire" />}
        title="Rien à faire"
        description="Tu n'as aucun devoir prévu pour les prochaines semaines."
      />
    )
  }

  return (
    <FadeIn>
      <OrderedGroups
        groups={summary.ordered}
        overdueCount={summary.overdueCount}
        pending={pending}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    </FadeIn>
  )
}

function OrderedGroups({
  groups,
  overdueCount,
  ...day
}: { groups: DayGroup[]; overdueCount: number } & DayGroupProps) {
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
            {index === 0 && overdueCount > 0 && (
              <h2 className="px-4 pt-3 pb-1 text-sm font-semibold text-destructive">
                En retard
              </h2>
            )}
            <DayGroupSection group={group} {...day} />
          </Fragment>
        ))}
      </m.div>
    </m.div>
  )
}

function ArchivedGroups({
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
