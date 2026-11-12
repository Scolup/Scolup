import { summarizeGroups } from "../grouping"
import { InlineError } from "@/components/InlineError"
import { EmptyState } from "@/components/EmptyState"
import { ProgressRing } from "@/components/ProgressRing"
import { useDelayedLoading } from "@/hooks/useDelayedLoading"
import { HomeworkListSkeleton } from "./HomeworkListSkeleton"
import { OrderedGroups } from "./DayGroupLists"
import type { DayGroupProps } from "./DayGroupSection"

type GroupSummary = ReturnType<typeof summarizeGroups>

export function HomeworkRows({
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
    <OrderedGroups
      groups={summary.ordered}
      pending={pending}
      onToggle={onToggle}
      onSelect={onSelect}
    />
  )
}
