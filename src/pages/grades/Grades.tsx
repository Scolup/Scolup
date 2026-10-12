import { m } from "motion/react"
import { useMemo, useState } from "react"
import { Mortarboard01Icon } from "@hugeicons/core-free-icons"
import { staggerContainer } from "@/hooks/use-micro-interactions"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useGradesPage } from "./hooks/useGradesPage"
import { AverageCard } from "./components/AverageCard"
import { GradeDrawer } from "./components/GradeDrawer"
import { GradesSkeleton } from "./components/GradesSkeleton"
import { PeriodPicker } from "./components/PeriodPicker"
import { RecentGradesStrip } from "./components/RecentGradesStrip"
import { SubjectGroupSection } from "./components/SubjectGroupSection"
import { InlineError } from "@/ui/inline-error"
import { EmptyState } from "@/ui/empty-state"
import { FadeIn } from "@/ui/fade-in"
import { Button } from "@/components/ui/button"
;("use client")

export function Grades() {
  const page = useGradesPage()
  const showSkeleton = useDelayedLoading(page.loading)
  // Point survolé sur le graphe (façon Papillon) : tant qu'il a le focus,
  // la carte affiche sa moyenne à la place de la moyenne actuelle.
  const [focusedAverage, setFocusedAverage] = useState<number | null>(null)
  // Impact de chaque note sur la moyenne (points gagnés/perdus), pour les
  // pastilles du strip — même source que l'ancien tooltip.
  const impacts = useMemo(
    () =>
      new Map(
        page.trend.flatMap((point) =>
          point.newcomers.map(
            (newcomer) => [newcomer.key, newcomer.impact] as const
          )
        )
      ),
    [page.trend]
  )

  return (
    <div className="flex w-full flex-col gap-0">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md">
        <PeriodPicker
          periods={page.periods}
          selected={page.selectedPeriod}
          onSelect={page.setSelectedPeriod}
        />
      </div>

      <div className="min-h-[50dvh]">
        {page.loading ? (
          showSkeleton ? (
            <GradesSkeleton />
          ) : null
        ) : page.error ? (
          <InlineError message={page.error} onRetry={page.retry} />
        ) : page.groups.length === 0 ? (
          <EmptyState
            icon={Mortarboard01Icon}
            title={"Aucune note"}
            description={"Tu n'as aucune note pour le moment."}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={page.retry}
                className="min-h-11"
              >
                Actualiser
              </Button>
            }
          />
        ) : (
          <FadeIn>
            <m.div
              variants={staggerContainer(0.035, 0.05)}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 px-4 pt-4 pb-6"
            >
              {page.overallAverage !== null && (
                <AverageCard
                  average={page.overallAverage}
                  focusedAverage={focusedAverage}
                  onFocusAverage={setFocusedAverage}
                  trend={page.trend}
                  trendDomain={page.trendDomain}
                  hasTrend={page.hasTrend}
                />
              )}
              <RecentGradesStrip
                grades={page.recentGrades}
                impacts={impacts}
                onPick={page.scrollToGrade}
              />
              {page.groups.map((group) => (
                <SubjectGroupSection
                  key={group.subject}
                  group={group}
                  evalColors={page.evalColors}
                  highlightedKey={page.highlightedKey}
                  registerRow={page.registerRow}
                  onOpen={page.openGrade}
                />
              ))}
            </m.div>
          </FadeIn>
        )}
      </div>

      <GradeDrawer
        grade={page.selected}
        subject={page.selectedSubject}
        periodLabel={page.selectedPeriodLabel}
        evalColors={page.evalColors}
        onClose={page.closeGrade}
      />
    </div>
  )
}
