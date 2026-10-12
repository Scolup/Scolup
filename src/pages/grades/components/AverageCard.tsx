import { lazy, Suspense, useEffect, useRef, useState } from "react"
import {
  countUpValue,
  formatAverage,
  formatAverageValue,
  type TrendPoint,
} from "../helpers"
import { AnimatedNumber } from "@/ui/animated-number"

const GradesTrendChart = lazy(() =>
  import("./GradesTrendChart").then((m) => ({ default: m.GradesTrendChart }))
)

// Count-up honnête (valeur réelle interpolée, ~700 ms ease-out) : la moyenne
// est le chiffre émotionnel de l'app, elle mérite le seul moment expressif.
// Reduced-motion : valeur directe, sans mouvement.
function useCountUp(target: number): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      from.current === target
    ) {
      setValue(target)
      from.current = target
      return
    }
    const start = from.current
    const t0 = performance.now()
    const duration = 700
    let raf = 0
    const tick = (now: number) => {
      const progress = (now - t0) / duration
      setValue(countUpValue(start, target, progress))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = target
    }
  }, [target])
  return value
}

export function AverageCard({
  average,
  focusedAverage,
  onFocusAverage,
  trend,
  trendDomain,
  hasTrend,
}: {
  average: number
  focusedAverage?: number | null
  onFocusAverage?: (average: number | null) => void
  trend: TrendPoint[]
  trendDomain: [number, number]
  hasTrend: boolean
}) {
  const animated = useCountUp(average)
  // Tant qu'un point du graphe a le focus, sa moyenne s'affiche en direct
  // (sans count-up : le doigt pilote) ; au relâcher, retour à la moyenne.
  const shown = focusedAverage ?? animated
  return (
    <section
      aria-label={`Moyenne générale : ${formatAverage(average)}`}
      className="flex flex-col gap-1 rounded-3xl border border-border/70 bg-card px-4 pt-3.5 pb-2"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-card-foreground">
          Moyenne générale
        </span>
        <span className="tabular-nums">
          <AnimatedNumber
            value={formatAverageValue(shown)}
            className="text-2xl font-bold text-card-foreground"
          />
          <span className="text-xs text-muted-foreground">/20</span>
        </span>
      </div>
      {hasTrend && (
        <Suspense
          fallback={
            <div aria-hidden="true" className="h-[140px] w-full md:h-[220px]" />
          }
        >
          <GradesTrendChart
            trend={trend}
            domain={trendDomain}
            onFocus={onFocusAverage}
          />
        </Suspense>
      )}
    </section>
  )
}
