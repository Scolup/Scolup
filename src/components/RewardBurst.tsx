import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { DECO_THEMES, isDecoThemeId } from "@/features/shop/decoThemes"
import { cn } from "@/lib/utils"

const BURST_COUNT = 14

// Moment fort : une gerbe de particules qui jaillit sous son toast (en haut
// pour les quêtes, au-dessus de la barre d'onglets sinon). Aux couleurs du
// thème déco actif, sinon à celles de l'accent. 100 % CSS (keyframes `burst`,
// transform et opacity) : aucune animation JavaScript pendant la gerbe.
// `tick` augmente à chaque événement ; zéro n'affiche rien.
export function RewardBurst({
  tick,
  placement = "bottom",
}: {
  tick: number
  placement?: "bottom" | "top"
}) {
  const { decoTheme } = useTheme()
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (tick === 0) return
    setBurst(tick)
    const timer = window.setTimeout(() => setBurst(0), 1050)
    return () => window.clearTimeout(timer)
  }, [tick])

  if (!burst) return null
  const accent = isDecoThemeId(decoTheme)
    ? DECO_THEMES[decoTheme].accent
    : "var(--primary)"
  const colors = ["#ffffff", accent]
  const fromTop = placement === "top"

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[59] overflow-hidden motion-reduce:hidden"
    >
      {Array.from({ length: BURST_COUNT }, (_, index) => {
        const spread = (index - (BURST_COUNT - 1) / 2) * 24
        return (
          <span
            key={`${burst}-${index}`}
            className={cn(
              "absolute left-1/2 size-2.5 rounded-full opacity-0",
              fromTop ? "top-20" : "bottom-24"
            )}
            style={
              {
                backgroundColor: colors[index % colors.length],
                "--bx": `${spread}px`,
                "--by": `${(fromTop ? 1 : -1) * (120 + (index % 4) * 30)}px`,
                animation: `burst 0.7s ease-out ${(index % 5) * 0.03}s forwards`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
