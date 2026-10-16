import { useEffect, useMemo, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { getSetting } from "@/services/storage"
import {
  ensureSubjects,
  resolveSubjectCoef,
  useSubjects,
} from "@/services/subjects"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import {
  cumulativeGeneralAverageByDay,
  generalAverage,
  groupBySubject,
  resolvePeriod,
  toGrade,
  toPeriod,
  toEvalColors,
  DEFAULT_EVAL_COLORS,
  type Grade,
  type Period,
  type TrendPoint,
} from "../helpers"

export interface GradesModel {
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

export function useGrades(): GradesModel {
  const [payload, setPayload] = useState<{
    grades: Grade[]
    periods: Period[]
    evalColors: string[]
    selectedPeriod: string
  } | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const liveGrades = useLiveRefresh("grades")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // The skeleton belongs to the first load. Later runs (retry, live refresh)
      // keep the current payload on screen and swap it when it lands.
      setLoading(payload === null)
      try {
        if (!(await ld.auth.loadSession())) {
          throw new Error("Aucune session active. Reconnecte-toi.")
        }
        const result = (await ld.grades.getGrades()) as {
          notes?: unknown
          periodes?: unknown
          parametrage?: unknown
        }
        if (cancelled) return
        const raw = Array.isArray(result.notes) ? result.notes : []
        const grades = (raw as Record<string, unknown>[]).map(toGrade)
        void ensureSubjects(
          grades.map((grade) => ({
            code: grade.subjectCode,
            name: grade.subject,
          }))
        )
        const rawPeriods = Array.isArray(result.periodes) ? result.periodes : []
        const periods = (rawPeriods as Record<string, unknown>[])
          .map(toPeriod)
          .filter((period): period is Period => period !== null)
        const stored = await getSetting("gradesPeriod")
        if (cancelled) return
        const defaultPeriod =
          resolvePeriod(
            periods,
            typeof stored === "string" ? stored : undefined
          )?.id ?? ""
        setPayload({
          grades,
          periods,
          evalColors: toEvalColors(result.parametrage),
          selectedPeriod: defaultPeriod,
        })
        // Keep the period the user picked across a background refresh, as long
        // as it still exists in the payload.
        setSelectedPeriod((prev) =>
          prev && periods.some((period) => period.id === prev)
            ? prev
            : defaultPeriod
        )
        setError(null)
      } catch (err) {
        if (cancelled) return
        // Same rule as `useAsync`: only a first load with nothing on screen
        // reports the error.
        if (payload !== null) return
        setError(errorMessage(err, "Impossible de charger les notes."))
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, liveGrades])

  const grades = payload?.grades ?? NO_GRADES
  const periods = payload?.periods ?? NO_PERIODS
  const evalColors = payload?.evalColors ?? DEFAULT_EVAL_COLORS
  // Se re-rend quand une matière change : les memos ci-dessous en dépendent
  // pour recalculer les moyennes pondérées par coefficient.
  const subjects = useSubjects()
  const coefOf = useMemo(
    () => (code?: string, name?: string) => resolveSubjectCoef(code, name),
    [subjects]
  )

  const visibleGrades = useMemo(() => {
    const selected = periods.find((period) => period.id === selectedPeriod)
    if (selected?.annuel || selectedPeriod === "") return grades
    return grades.filter((grade) => grade.period === selectedPeriod)
  }, [grades, periods, selectedPeriod])

  const groups = useMemo(
    () => groupBySubject(visibleGrades, coefOf),
    [visibleGrades, coefOf]
  )
  const overallAverage = useMemo(() => generalAverage(groups), [groups])
  const trend = useMemo(
    () => cumulativeGeneralAverageByDay(visibleGrades, coefOf),
    [visibleGrades, coefOf]
  )
  const hasTrend = useMemo(
    () => trend.some((point) => point.average !== null),
    [trend]
  )
  const trendDomain = useMemo((): [number, number] => {
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const point of trend) {
      if (point.average === null) continue
      if (point.average < min) min = point.average
      if (point.average > max) max = point.average
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 20]
    return [Math.max(0, min - 0.5), Math.min(20, max + 0.5)]
  }, [trend])

  const recentGrades = useMemo(() => {
    const cutoff = Date.now() - RECENT_DAYS * 86_400_000
    return visibleGrades
      .filter(
        (grade) =>
          grade.enteredOn instanceof Date && grade.enteredOn.getTime() >= cutoff
      )
      .sort(
        (a, b) =>
          (b.enteredOn as Date).getTime() - (a.enteredOn as Date).getTime()
      )
  }, [visibleGrades])

  return {
    grades,
    groups,
    overallAverage,
    periods,
    selectedPeriod,
    setSelectedPeriod,
    evalColors,
    trend,
    hasTrend,
    trendDomain,
    recentGrades,
    loading,
    error,
    retry: () => {
      setError(null)
      setReloadKey((key) => key + 1)
    },
  }
}
