import { useMemo, useState } from "react"
import { errorMessage } from "@/services/errors"
import { syncGrades } from "@/features/quests/service"
import { ensureSubjects } from "@/features/subjects/edit"
import { resolveSubjectCoef } from "@/features/subjects/resolve"
import { useSubjects } from "@/features/subjects/store"
import { useAsync } from "@/hooks/useAsync"
import { useLiveRefresh } from "@/hooks/useLiveRefresh"
import { useAverageSettings } from "@/features/grades/averageSettings"
import {
  computeOverallAverage,
  groupBySubject,
} from "@/features/grades/averages"
import { fetchGrades } from "@/features/grades/fetchGrades"
import { recentGrades } from "@/features/grades/grade"
import { DEFAULT_EVAL_COLORS } from "@/features/grades/mappers"
import {
  cumulativeGeneralAverageByDay,
  computeTrendDomain,
} from "@/features/grades/trend"
import type { Grade, Period, TrendPoint } from "@/features/grades/types"

interface GradesModel {
  grades: Grade[]
  groups: ReturnType<typeof groupBySubject>
  overallAverage: number | null
  periods: Period[]
  selectedPeriod: string
  setSelectedPeriod: (id: string) => void
  evalColors: string[]
  trend: TrendPoint[]
  hasTrend: boolean
  trendDomain: [number, number]
  recentGrades: Grade[]
  loading: boolean
  error: string | null
  retry: () => void
}

const RECENT_DAYS = 15
const NO_GRADES: Grade[] = []
const NO_PERIODS: Period[] = []

// Charge les notes et mémorise les matières et les quêtes qui en dépendent.
async function loadGrades() {
  const data = await fetchGrades()
  void syncGrades(data.grades)
  void ensureSubjects(
    data.grades.map((grade) => ({
      code: grade.subjectCode,
      name: grade.subject,
    }))
  )
  return data
}

export function useGrades(): GradesModel {
  const [reloadKey, setReloadKey] = useState(0)
  const liveGrades = useLiveRefresh("grades")
  const { data, error, loading } = useAsync(loadGrades, [reloadKey, liveGrades])

  const grades = data?.grades ?? NO_GRADES
  const periods = data?.periods ?? NO_PERIODS
  const evalColors = data?.evalColors ?? DEFAULT_EVAL_COLORS

  // La période choisie par l'élève reste affichée quand les notes se
  // rafraîchissent, tant qu'elle existe encore ; sinon on revient à la période
  // par défaut.
  const [pickedPeriod, setSelectedPeriod] = useState("")
  const selectedPeriod = periods.some((period) => period.id === pickedPeriod)
    ? pickedPeriod
    : (data?.defaultPeriod?.id ?? "")

  // Se re-rend quand une matière change : les calculs ci-dessous en dépendent
  // pour recalculer les moyennes pondérées par coefficient.
  const subjects = useSubjects()
  const coefOf = useMemo(
    () => (code?: string, name?: string) => resolveSubjectCoef(code, name),
    [subjects]
  )
  const { method } = useAverageSettings()

  const visibleGrades = useMemo(() => {
    const selected = periods.find((period) => period.id === selectedPeriod)
    if (selected?.annuel || selectedPeriod === "") return grades
    return grades.filter((grade) => grade.period === selectedPeriod)
  }, [grades, periods, selectedPeriod])

  const groups = useMemo(
    () => groupBySubject(visibleGrades, coefOf, method),
    [visibleGrades, coefOf, method]
  )
  const overallAverage = computeOverallAverage(
    visibleGrades,
    groups,
    coefOf,
    method
  )
  const trend = useMemo(
    () =>
      cumulativeGeneralAverageByDay(
        visibleGrades,
        coefOf,
        30,
        new Date(),
        method
      ),
    [visibleGrades, coefOf, method]
  )

  const domain = useMemo(() => computeTrendDomain(trend), [trend])
  const recent = useMemo(
    () => recentGrades(visibleGrades, RECENT_DAYS),
    [visibleGrades]
  )

  return {
    grades,
    groups,
    overallAverage,
    periods,
    selectedPeriod,
    setSelectedPeriod,
    evalColors,
    trend,
    hasTrend: trend.some((point) => point.average !== null),
    trendDomain: domain,
    recentGrades: recent,
    loading,
    error: error
      ? errorMessage(error, "Impossible de charger les notes.")
      : null,
    retry: () => setReloadKey((key) => key + 1),
  }
}
