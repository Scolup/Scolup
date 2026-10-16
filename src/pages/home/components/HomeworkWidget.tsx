"use client"

import { useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
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
import { triggerHapticLight } from "@/services/haptics"

export function HomeworkWidget() {
  const navigate = useNavigate()
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
  const remaining = useMemo(
    () => assignments.filter((assignment) => !assignment.done).length,
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
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              triggerHapticLight()
              navigate("/homework")
            }}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="truncate text-sm font-semibold text-card-foreground">
              Devoirs
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {remaining === 0
                ? "Tout est fait"
                : `${remaining} restant${remaining > 1 ? "s" : ""}`}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
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
