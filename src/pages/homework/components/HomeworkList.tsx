import { useMemo } from "react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { summarizeGroups } from "../grouping"
import type { Assignment, DayGroup } from "../types"
import { EmptyState } from "@/components/EmptyState"
import { HomeworkRows } from "./HomeworkRows"
import { ArchivedGroups } from "./DayGroupLists"

export interface HomeworkListProps {
  groups: DayGroup[]
  loading: boolean
  error: string | null
  onRetry: () => void
  pending: Set<string>
  onToggle: (assignment: Assignment) => void
  onSelect: (assignment: Assignment) => void
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
