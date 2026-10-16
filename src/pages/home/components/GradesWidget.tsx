"use client"

import { useMemo, lazy, Suspense, useState } from "react"
import type { CSSProperties } from "react"
import { useNavigate } from "react-router"
import { formatDistanceToNowStrict } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { Mortarboard01Icon } from "@hugeicons/core-free-icons"
import { ld } from "@/services/litedirecte"
import { getSetting, readLastSeen } from "@/services/storage"
import { useAsync } from "@/hooks/use-async"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { WidgetEmpty, WidgetError } from "./WidgetState"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "@/ui/animated-number"
import {
  resolveSubjectColor,
  resolveSubjectName,
  useSubjects,
} from "@/services/subjects"
import { Badge } from "@/components/ui/badge"
import { useSplashTask } from "@/services/splash"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatAverageValue,
  cumulativeGeneralAverageByDay,
  generalAverage,
  gradeLabel,
  groupBySubject,
  resolvePeriod,
  toGrade,
  toPeriod,
  type Grade,
  type Period,
} from "@/pages/grades/helpers"

const GradesTrendChart = lazy(() =>
  import("@/pages/grades/components/GradesTrendChart").then((m) => ({
    default: m.GradesTrendChart,
  }))
)

const RECENT_MS = 3 * 86_400_000
const NO_GRADES: Grade[] = []

export function GradesWidget() {
  const navigate = useNavigate()
  useSubjects()
  const [reloadKey, setReloadKey] = useState(0)
  // Moyenne à la date survolée, comme sur la page notes : tant qu'un point
  // du mini-graphe a le focus, elle remplace la moyenne actuelle.
  const [focusedAverage, setFocusedAverage] = useState<number | null>(null)
  const { data: lastSeen = 0 } = useAsync(() => readLastSeen("grades"), [])
  const liveGrades = useLiveRefresh("grades")
  const { data, error, loading } = useAsync(async () => {
    if (!(await ld.auth.loadSession())) throw new Error("no session")
    const result = (await ld.grades.getGrades()) as {
      notes?: unknown
      periodes?: unknown
    }
    const raw = Array.isArray(result.notes) ? result.notes : []
    const grades = (raw as Record<string, unknown>[]).map((entry, index) =>
      toGrade(entry, index)
    )
    const rawPeriods = Array.isArray(result.periodes) ? result.periodes : []
    const periods = (rawPeriods as Record<string, unknown>[])
      .map(toPeriod)
      .filter((entry): entry is Period => entry !== null)
    const stored = await getSetting("gradesPeriod")
    return {
      grades,
      period: resolvePeriod(
        periods,
        typeof stored === "string" ? stored : undefined
      ),
    }
  }, [liveGrades, reloadKey])

  useSplashTask(loading)
  const showSkeleton = useDelayedLoading(loading)

  const grades = data?.grades ?? NO_GRADES
  const period = data?.period ?? null

  const { average, recent, trend, trendDomain, hasTrend, impacts } =
    useMemo(() => {
      const visible =
        !period || period.annuel
          ? grades
          : grades.filter((grade) => grade.period === period.id)
      const groups = groupBySubject(visible)
      const cutoff = Date.now() - RECENT_MS
      const fresh = visible
        .filter(
          (grade) =>
            grade.enteredOn instanceof Date &&
            grade.enteredOn.getTime() >= cutoff
        )
        .sort(
          (a, b) =>
            (b.enteredOn as Date).getTime() - (a.enteredOn as Date).getTime()
        )
        .slice(0, 3)
      const points = cumulativeGeneralAverageByDay(visible)
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY
      for (const point of points) {
        if (point.average === null) continue
        if (point.average < min) min = point.average
        if (point.average > max) max = point.average
      }
      return {
        average: generalAverage(groups),
        recent: fresh,
        trend: points,
        impacts: new Map(
          points.flatMap((point) =>
            point.newcomers.map(
              (newcomer) => [newcomer.key, newcomer.impact] as const
            )
          )
        ),
        trendDomain: (Number.isFinite(min) && Number.isFinite(max)
          ? [Math.max(0, min - 0.5), Math.min(20, max + 0.5)]
          : [0, 20]) as [number, number],
        hasTrend: points.some((point) => point.average !== null),
      }
    }, [grades, period])

  if (error)
    return <WidgetError onRetry={() => setReloadKey((key) => key + 1)} />
  if (loading) {
    if (!showSkeleton) {
      return (
        <section
          aria-hidden="true"
          className="min-h-[76px] rounded-3xl border border-border/70 bg-card p-4"
        />
      )
    }
    return (
      <section
        aria-hidden="true"
        className="rounded-3xl border border-border/70 bg-card p-4"
      >
        <Skeleton className="h-16 w-full rounded-2xl" />
      </section>
    )
  }
  if (average === null)
    return (
      <WidgetEmpty
        icon={Mortarboard01Icon}
        title="Aucune note"
        hint="Tes notes apparaîtront ici."
      />
    )

  return (
    <section
      aria-label={`Moyenne générale : ${formatAverageValue(average)}/20`}
      className="flex flex-col gap-1.5 rounded-3xl border border-border/70 bg-card p-4"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-end gap-3 px-3.5">
          <span className="shrink-0 tabular-nums">
            <AnimatedNumber
              value={formatAverageValue(focusedAverage ?? average)}
              className="text-2xl font-bold text-card-foreground"
            />
            <span className="text-xs text-muted-foreground">/20</span>
          </span>
        </div>
        {hasTrend && (
          <Suspense
            fallback={<div aria-hidden="true" className="h-[110px] w-full" />}
          >
            <GradesTrendChart
              trend={trend}
              domain={trendDomain}
              onFocus={setFocusedAverage}
              className="h-[110px] w-full"
            />
          </Suspense>
        )}
        {recent.map((grade) => {
          const color = resolveSubjectColor(grade.subjectCode, grade.subject)
          const impact = impacts.get(grade.key)
          const isNew =
            lastSeen > 0 &&
            grade.enteredOn instanceof Date &&
            grade.enteredOn.getTime() > lastSeen
          return (
            <button
              key={grade.key}
              type="button"
              onClick={() => navigate("/grades")}
              className="flex min-h-11 items-center gap-2.5 rounded-2xl px-3.5 py-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-card-foreground">
                  {grade.title}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  {isNew && (
                    <Badge variant="info" size="sm" pill className="shrink-0">
                      Nouveau
                    </Badge>
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    {resolveSubjectName(grade.subjectCode, grade.subject)}
                    {grade.enteredOn instanceof Date &&
                      ` · ${formatDistanceToNowStrict(grade.enteredOn, { addSuffix: true, locale: fr })}`}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  grade.nonSignificant && "opacity-60",
                  impact !== undefined &&
                    impact !== 0 &&
                    (impact > 0 ? "text-success" : "text-destructive"),
                  (impact === undefined || impact === 0) &&
                    "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]"
                )}
                style={
                  impact !== undefined && impact !== 0
                    ? undefined
                    : ({ "--c": color } as CSSProperties)
                }
              >
                {gradeLabel(grade)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
