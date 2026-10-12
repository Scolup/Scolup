import { Area, AreaChart, CartesianGrid, YAxis } from "recharts"
import { useRef, useState } from "react"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { TrendPoint } from "../helpers"
import { triggerHapticLight } from "@/services/haptics"

const trendChartConfig = {
  average: { label: "Moyenne", color: "var(--primary)" },
} satisfies ChartConfig

const SUPPRESS_MS = 250

export function GradesTrendChart({
  trend,
  domain,
  interactive = true,
  onFocus,
  className,
}: {
  trend: TrendPoint[]
  domain: [number, number]
  interactive?: boolean
  onFocus?: (average: number | null) => void
  className?: string
}) {
  // Dernier cran survolé : le graphe se touche, chaque point traversé
  // émet une micro-vibration (façon Papillon `Averages.tsx`).
  const lastActive = useRef<number | string | null>(null)
  // Visibilité du point pilotée par NOUS (`activeDot` ci-dessous), pas par
  // l'état interne recharts — qui ne s'efface que sur un vrai `mouseleave`,
  // jamais émis au relâcher tactile.
  const [isFocused, setIsFocused] = useState(false)
  // Anti-écho : après un relâcher, le navigateur rejoue un `mousemove`
  // émulé (parfois différé d'une frame) qui rallumerait le focus. On
  // l'ignore pendant une courte fenêtre.
  const suppressUntil = useRef(0)

  // Pas de carte tooltip ici : seul le point de focus marque la position,
  // la moyenne survolée remonte via `onFocus` vers la carte moyenne.
  const clearFocus = () => {
    lastActive.current = null
    suppressUntil.current = Date.now() + SUPPRESS_MS
    setIsFocused(false)
    onFocus?.(null)
  }

  // Souris ET tactile : sur mobile, le drag n'émet jamais de mousemove
  // (seul le tap produit des événements souris émulés), il faut écouter
  // le touchmove sous peine de devoir cliquer chaque point.
  const handleActive = (
    state: {
      activeTooltipIndex?: number | string | null
    } | null
  ) => {
    if (Date.now() < suppressUntil.current) return
    const index = state?.activeTooltipIndex
    if (index == null || index === lastActive.current) {
      return
    }
    lastActive.current = index
    triggerHapticLight()
    setIsFocused(true)
    // recharts v3 envoie l'index en string ("5") : on le convertit, sinon
    // `trend[index]` rate et le point survolé ne remonte jamais.
    const at = typeof index === "number" ? index : Number.parseInt(index, 10)
    onFocus?.(Number.isInteger(at) ? (trend[at]?.average ?? null) : null)
  }

  return (
    <ChartContainer
      config={trendChartConfig}
      className={className ?? "h-[140px] w-full md:h-[220px]"}
    >
      <AreaChart
        accessibilityLayer={interactive}
        data={trend}
        margin={{ top: 8, right: 8, bottom: 8, left: -24 }}
        onMouseMove={interactive ? handleActive : undefined}
        onTouchMove={interactive ? handleActive : undefined}
        onMouseLeave={interactive ? clearFocus : undefined}
        // Sur mobile la sélection reste collée au relâcher : on défocus
        // explicitement (façon Papillon), au cas où le mouseleave
        // synthétique ne suivrait pas.
        onMouseUp={interactive ? clearFocus : undefined}
        onTouchEnd={interactive ? clearFocus : undefined}
      >
        <CartesianGrid vertical={false} />
        <YAxis hide domain={domain} />
        {interactive && <ChartTooltip cursor={false} content={() => null} />}
        <Area
          dataKey="average"
          type="monotone"
          fill="var(--color-average)"
          fillOpacity={0.25}
          stroke="var(--color-average)"
          strokeWidth={2}
          dot={false}
          activeDot={isFocused}
        />
      </AreaChart>
    </ChartContainer>
  )
}
