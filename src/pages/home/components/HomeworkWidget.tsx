"use client"

import { useMemo } from "react"
import { readLastSeen } from "@/services/storage"
import { useAsync } from "@/hooks/use-async"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { HomeworkEntry } from "@/pages/homework/components/HomeworkEntry"
import { HomeworkDrawer } from "@/pages/homework/components/HomeworkDrawer"
import { useHomework, useToggleDone } from "@/pages/homework/hooks/useHomework"
import { useHomeworkDetail } from "@/pages/homework/hooks/useHomeworkDetail"
import { useHomeworkComment } from "@/pages/homework/hooks/useHomeworkComment"
import { WidgetSkeleton } from "@/pages/home/components/WidgetSkeleton"
import { WidgetError } from "@/pages/home/components/WidgetState"
import { useSplashTask } from "@/services/splash"
import { ProgressRing } from "@/ui/progress-ring"

export function HomeworkWidget() {
  const { assignments, setAssignments, loading, error, setReloadKey } =
    useHomework()
  const { toggle, pending } = useToggleDone(setAssignments)
  const detail = useHomeworkDetail(assignments, setAssignments)
  const comment = useHomeworkComment(setAssignments)
  const { data: lastSeen = 0 } = useAsync(() => readLastSeen("homework"), [])

  useSplashTask(loading)
  const showSkeleton = useDelayedLoading(loading)

  const visible = useMemo(
    () =>
      assignments
        .filter((assignment) => !assignment.done)
        .sort((a, b) => a.due.getTime() - b.due.getTime())
        .slice(0, 3),
    [assignments]
  )

  if (error)
    return <WidgetError onRetry={() => setReloadKey((key) => key + 1)} />
  if (loading) {
    if (!showSkeleton) {
      return (
        <section
          aria-hidden="true"
          className="min-h-[76px] rounded-3xl border border-border/70 bg-card"
        />
      )
    }
    return <WidgetSkeleton />
  }

  return (
    <>
      <section
        aria-label="Devoirs à faire"
        className="rounded-3xl border border-border/70 bg-card"
      >
        {visible.length === 0 ? (
          <div className="flex items-center gap-3 p-4">
            <ProgressRing value={1} size={36} label="Aucun devoir à venir" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-card-foreground">
                Rien à faire
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Aucun devoir à venir.
              </span>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {visible.map((assignment) => (
              <HomeworkEntry
                key={assignment.key}
                assignment={assignment}
                pending={pending.has(assignment.key)}
                isNew={
                  lastSeen > 0 &&
                  assignment.givenOn !== undefined &&
                  assignment.givenOn.getTime() > lastSeen
                }
                onToggle={() => void toggle(assignment)}
                onSelect={detail.selectAssignment}
              />
            ))}
          </div>
        )}
      </section>
      <HomeworkDrawer
        assignment={detail.selected}
        detail={detail.detail}
        loading={detail.detailLoading}
        error={detail.detailError}
        onRetry={detail.retryDetail}
        pending={detail.selected ? pending.has(detail.selected.key) : false}
        onToggle={(assignment) => void toggle(assignment)}
        comment={comment}
        onClose={detail.closeDetail}
      />
    </>
  )
}
