import { useMemo, useState } from "react"
import {
  Mortarboard01Icon,
  User02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { EmptyState } from "@/components/EmptyState"
import { InlineError } from "@/components/InlineError"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { impactsByGrade } from "@/features/grades/trend"
import { useFirstVisit } from "@/hooks/useFirstVisit"
import { triggerHapticLight } from "@/services/haptics"
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
  const [averageMode, setAverageMode] = useState<"student" | "class">("student")
  const showClass = page.pronote && averageMode === "class"
  const hasClassTrend = page.classTrend.some((point) => point.average !== null)
  const averageLabel = !page.pronote
    ? "Moyenne générale"
    : showClass
      ? "Moyenne classe"
      : "Moyenne élève"
  const animateRows = useFirstVisit("grades-rows")
  const impacts = useMemo(() => impactsByGrade(page.trend), [page.trend])

  if (page.loading) return showSkeleton ? <GradesSkeleton /> : null

  if (page.error) {
    return <InlineError message={page.error} onRetry={page.retry} />
  }

  if (
    page.groups.length === 0 &&
    page.overallAverage === null &&
    page.classAverage === undefined
  ) {
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
      {(page.overallAverage !== null || page.pronote) && (
        <AverageCard
          label={averageLabel}
          average={
            showClass ? (page.classAverage ?? null) : page.overallAverage
          }
          trend={showClass ? page.classTrend : page.trend}
          trendDomain={showClass ? page.classTrendDomain : page.trendDomain}
          hasTrend={showClass ? hasClassTrend : page.hasTrend}
          description={
            showClass && hasClassTrend
              ? "Courbe estimée à partir des moyennes des contrôles."
              : undefined
          }
          control={
            page.pronote && (
              <Select
                value={averageMode}
                onValueChange={(value) => {
                  if (
                    (value === "student" || value === "class") &&
                    value !== averageMode
                  ) {
                    triggerHapticLight()
                    setAverageMode(value)
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Choisir la moyenne du graphique"
                  className="w-fit rounded-full"
                >
                  <SelectValue>
                    {() => (
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={showClass ? UserGroupIcon : User02Icon}
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {averageLabel}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <HugeiconsIcon
                      icon={User02Icon}
                      className="size-4"
                      aria-hidden="true"
                    />
                    Moyenne élève
                  </SelectItem>
                  <SelectItem value="class">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      className="size-4"
                      aria-hidden="true"
                    />
                    Moyenne classe
                  </SelectItem>
                </SelectContent>
              </Select>
            )
          }
        />
      )}
      <RecentGradesStrip
        byEvaluationDate={page.pronote}
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
