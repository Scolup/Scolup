import { useMemo } from "react"
import { Mortarboard01Icon } from "@hugeicons/core-free-icons"
import { EmptyState } from "@/components/EmptyState"
import { InlineError } from "@/components/InlineError"
import { Button } from "@/components/ui/button"
import { impactsByGrade } from "@/features/grades/trend"
import { useFirstVisit } from "@/hooks/useFirstVisit"
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
  const animateRows = useFirstVisit("grades-rows")
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

  // Un seul fondu quand la période change (la clé remonte le bloc) ; les
  // premières lignes de la première visite seulement ont leur léger décalage.
  let offset = 0

  return (
    <div
      key={page.selectedPeriod ?? "all"}
      className="flex content-in flex-col gap-6 px-4 pt-4 pb-6"
    >
      {page.overallAverage !== null && (
        <AverageCard
          average={page.overallAverage}
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
      {page.groups.map((group) => {
        const start = offset
        offset += group.grades.length
        return (
          <SubjectGroupSection
            key={group.subject}
            group={group}
            offset={animateRows ? start : undefined}
            evalColors={page.evalColors}
            highlightedKey={page.highlightedKey}
            registerRow={page.registerRow}
            onOpen={page.openGrade}
          />
        )
      })}
    </div>
  )
}
