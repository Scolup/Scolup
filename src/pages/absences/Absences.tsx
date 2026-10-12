"use client"

import { useCallback } from "react"
import { m } from "motion/react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon, Chair02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/ui/empty-state"
import { InlineError } from "@/ui/inline-error"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useAttendance } from "./hooks/useAttendance"
import { AbsencesContent } from "./components/AbsencesContent"
import { AbsencesSkeleton } from "./components/AbsencesSkeleton"

export function Absences() {
  const navigate = useNavigate()
  const {
    events,
    sanctions,
    dispenses,
    isEmpty,
    stats,
    loading,
    error,
    retry,
  } = useAttendance()

  const goBack = useCallback(() => {
    navigate("/")
  }, [navigate])
  const showSkeleton = useDelayedLoading(loading)

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          className="size-11 shrink-0"
          onClick={goBack}
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-foreground">
          Absences
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          showSkeleton ? (
            <AbsencesSkeleton />
          ) : null
        ) : error ? (
          <InlineError message={error} onRetry={retry} />
        ) : isEmpty ? (
          <EmptyState
            icon={Chair02Icon}
            title="Aucune absence"
            description="Tu n'as aucune absence ni aucun retard enregistré."
          />
        ) : (
          <AbsencesContent
            eventCount={events.length}
            sanctions={sanctions}
            dispenses={dispenses}
            stats={stats}
          />
        )}
      </div>
    </m.div>
  )
}
