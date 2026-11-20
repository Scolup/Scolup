import {
  lazy,
  Suspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react"
import { countUpValue } from "@/lib/countUp"
import { formatAverage, formatAverageValue } from "@/features/grades/averages"
import { type AverageScale, type TrendPoint } from "@/features/grades/types"
import { useAverageSettings } from "@/features/grades/averageSettings"
import { useTheme } from "@/components/ThemeProvider"
import { AnimatedNumber } from "@/components/AnimatedNumber"

const GradesTrendChart = lazy(() =>
  import("./GradesTrendChart").then((m) => ({ default: m.GradesTrendChart }))
)

// Count-up honnête (valeur réelle interpolée, ~700 ms ease-out) : la moyenne
// est le chiffre émotionnel de l'app, elle mérite le seul moment expressif.
// Le texte est écrit directement dans le DOM à chaque image : aucun état React,
// donc aucun re-rendu de la carte (ni du graphe) pendant l'animation.
// Reduced-motion : valeur directe, sans mouvement.
function useCountUp(
  target: number,
  scale: AverageScale,
  ref: RefObject<HTMLSpanElement | null>
) {
  const from = useRef(target)
  useLayoutEffect(() => {
    const element = ref.current
    if (
      !element ||
      from.current === target ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      from.current = target
      return
    }
    const start = from.current
    const t0 = performance.now()
    const duration = 500
    let raf = 0
    const tick = (now: number) => {
      const progress = (now - t0) / duration
      const value = countUpValue(start, target, progress)
      from.current = value
      if (ref.current) {
        ref.current.textContent = formatAverageValue(value, scale)
      }
      if (progress < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    // Première image synchrone : pas de flash de la valeur finale.
    element.textContent = formatAverageValue(start, scale)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, scale, ref])
}

export function AverageCard({
  average,
  trend,
  trendDomain,
  hasTrend,
  label = "Moyenne générale",
  control,
  description,
}: {
  average: number | null
  trend: TrendPoint[]
  trendDomain: [number, number]
  hasTrend: boolean
  label?: string
  control?: ReactNode
  description?: string
}) {
  const { scale } = useAverageSettings()
  const { decoTheme } = useTheme()
  const countRef = useRef<HTMLSpanElement>(null)
  useCountUp(average ?? 0, scale, countRef)
  // Tant qu'un point du graphe a le focus, sa moyenne s'affiche en direct
  // (le doigt pilote, chiffres qui roulent) ; au relâcher, retour à la
  // moyenne. L'état vit ici et non dans la page : le survol ne re-rend plus
  // toute la liste des notes.
  const [focus, setFocus] = useState<{
    trend: TrendPoint[]
    average: number | null
  } | null>(null)
  const focusedAverage = focus?.trend === trend ? focus.average : null
  const handleFocus = useCallback(
    (point: number | null) => {
      setFocus(point === null ? null : { trend, average: point })
    },
    [trend]
  )
  return (
    <section
      aria-label={`${label} · ${average === null ? "Non publiée" : formatAverage(average, scale)}`}
      className="flex flex-col gap-1 rounded-3xl border border-border/70 bg-card px-4 pt-3.5 pb-2"
    >
      <div className="flex items-center justify-between gap-3">
        {control ?? (
          <span className="text-sm font-semibold text-card-foreground">
            {label}
          </span>
        )}
        {average === null ? (
          <span className="text-xs text-muted-foreground">Non publiée</span>
        ) : (
          <span className="tabular-nums">
            {focusedAverage !== null ? (
              <AnimatedNumber
                value={formatAverageValue(focusedAverage, scale)}
                className="text-2xl font-bold text-card-foreground"
              />
            ) : (
              <span
                ref={countRef}
                className="inline-flex text-2xl font-bold text-card-foreground tabular-nums"
              >
                {formatAverageValue(average, scale)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {scale === 100 ? " %" : `/${scale}`}
            </span>
          </span>
        )}
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
            scolupPattern={decoTheme === "evomoyenne"}
            onFocus={handleFocus}
          />
        </Suspense>
      )}
      {description && (
        <p className="py-1 text-xs text-muted-foreground">{description}</p>
      )}
    </section>
  )
}
