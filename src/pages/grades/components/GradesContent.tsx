import { AnimatePresence, m } from "motion/react"
import { useMemo, useState } from "react"
import { Mortarboard01Icon } from "@hugeicons/core-free-icons"
import { EmptyState } from "@/components/EmptyState"
import { FadeIn } from "@/components/FadeIn"
import { InlineError } from "@/components/InlineError"
import { Button } from "@/components/ui/button"
import { impactsByGrade } from "@/features/grades/trend"
import { staggerContainer } from "@/lib/motion"
import type { useGradesPage } from "../hooks/useGradesPage"
import { AverageCard } from "./AverageCard"
import { GradesSkeleton } from "./GradesSkeleton"
import { RecentGradesStrip } from "./RecentGradesStrip"
import { SubjectGroupSection } from "./SubjectGroupSection"

// Le contenu de la page Notes : chargement, erreur, liste vide, ou les notes.
export function GradesContent({
  page,
  showSkeleton,
}: {
  page: ReturnType<typeof useGradesPage>
  showSkeleton: boolean
}) {
  // Point survolé sur le graphe : tant qu'il a le focus, la carte affiche sa
  // moyenne à la place de la moyenne actuelle.
  const [focusedAverage, setFocusedAverage] = useState<number | null>(null)
  const impacts = useMemo(() => impactsByGrade(page.trend), [page.trend])

  if (page.loading) return showSkeleton ? <GradesSkeleton /> : null

  if (page.error) {
    return <InlineError message={page.error} onRetry={page.retry} />
  }

  if (page.groups.length === 0) {
    return (
      <EmptyState
        icon={Mortarboard01Icon}
        title="Aucune note"
        description="Tu n'as aucune note pour le moment."
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
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={page.selectedPeriod ?? "all"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
      >
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
      </m.div>
    </AnimatePresence>
  )
}
