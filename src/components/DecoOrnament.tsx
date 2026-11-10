import { useEffect, useState } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { DECO_THEMES, isDecoThemeId } from "@/features/shop/decoThemes"

// The active deco theme (shop "thèmes"). A theme is a whole-app identity, not
// a sticker pack: its hue repaints every surface (see ThemeProvider),
// <DecoParticles /> lays its weather over every screen (only Christmas has
// one), <DecoMotif /> gives the home hero a stronger signature, and
// <DecoBurst /> celebrates a reward in the theme's colors. All three render
// nothing when no theme is active.

// The December snowfall, far layer to near. Far flakes are small, faint and
// slow, near ones big and quick: together they read as depth. The `left`
// values and delays are irregular on purpose, so the field never looks like
// a marching grid.
const SNOW_LAYERS: {
  className: string
  sway: [number, number] // drift right then left before coming home (px)
  flakes: {
    left: string
    size: string
    duration: number // seconds to fall
    delay: number
  }[]
}[] = [
  {
    // Far dots, barely there: they only hint at the distance.
    className: "bg-slate-300/60 dark:bg-white/45",
    sway: [4, 2],
    flakes: [
      { left: "3%", size: "size-1.5", duration: 29, delay: 4 },
      { left: "9%", size: "size-2", duration: 26, delay: 11 },
      { left: "17%", size: "size-1.5", duration: 28, delay: 7 },
      { left: "26%", size: "size-2", duration: 24, delay: 1 },
      { left: "38%", size: "size-1.5", duration: 30, delay: 9 },
      { left: "53%", size: "size-2", duration: 27, delay: 15 },
      { left: "70%", size: "size-1.5", duration: 25, delay: 5 },
      { left: "87%", size: "size-2", duration: 29, delay: 13 },
    ],
  },
  {
    // The classic snow dots.
    className: "bg-slate-300 dark:bg-white/75",
    sway: [10, 5],
    flakes: [
      { left: "6%", size: "size-2.5", duration: 17, delay: 3 },
      { left: "13%", size: "size-3", duration: 15, delay: 8 },
      { left: "22%", size: "size-2.5", duration: 19, delay: 0 },
      { left: "33%", size: "size-3", duration: 16, delay: 12 },
      { left: "47%", size: "size-2.5", duration: 18, delay: 6 },
      { left: "62%", size: "size-3", duration: 15, delay: 10 },
      { left: "78%", size: "size-2.5", duration: 16, delay: 2 },
      { left: "93%", size: "size-3", duration: 19, delay: 13 },
    ],
  },
  {
    // Near flakes: the biggest and the quickest.
    className: "bg-slate-400 dark:bg-white/95",
    sway: [16, 9],
    flakes: [
      { left: "11%", size: "size-3.5", duration: 12, delay: 5 },
      { left: "41%", size: "size-4", duration: 10, delay: 9 },
      { left: "66%", size: "size-3.5", duration: 13, delay: 0 },
      { left: "84%", size: "size-4", duration: 11, delay: 7 },
    ],
  },
]

// The single motif, cropped into the top-right of the home hero gradient.
export function DecoMotif() {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  const { motif, accent } = DECO_THEMES[decoTheme]

  return (
    <m.span
      aria-hidden="true"
      className="pointer-events-none absolute -top-12 -right-8 opacity-30 dark:opacity-40"
      animate={{ y: [0, -6, 0], rotate: [-10, -6, -10] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <HugeiconsIcon
        icon={motif}
        style={{ color: accent }}
        className="size-56"
      />
    </m.span>
  )
}

// The app-wide weather. Only the Christmas theme has one: a fixed overlay
// mounted once at the App root, above the page content but below drawers
// (z-50) and toasts (z-60). Pointer events pass through.
export function DecoParticles() {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  if (!DECO_THEMES[decoTheme].snow) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      <Snow />
    </div>
  )
}

// Plain snow circles, no glow: slate-tinted in the light and white in the
// dark, so they stay readable on the pure-white background.
function Snow() {
  return (
    <>
      {SNOW_LAYERS.flatMap((layer) =>
        layer.flakes.map((flake) => (
          <m.span
            key={flake.left}
            style={{ left: flake.left }}
            className={cn(
              "absolute top-0 rounded-full",
              flake.size,
              layer.className
            )}
            // NOTE: fixed travel distance (px), not vh: motion interpolates
            // the fall reliably everywhere; on very tall screens flakes
            // simply leave the view before restarting.
            animate={{
              y: [-16, 1600],
              x: [0, layer.sway[0], -layer.sway[1], 0],
            }}
            transition={{
              duration: flake.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: flake.delay,
            }}
          />
        ))
      )}
    </>
  )
}

const BURST_COUNT = 14

// One-shot reward burst in the theme's colors, rising from above the tab bar.
// `tick` increments on each quest reward; a zero tick renders nothing.
export function DecoBurst({ tick }: { tick: number }) {
  const { decoTheme } = useTheme()
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (tick === 0) return
    setBurst(tick)
    const timer = window.setTimeout(() => setBurst(0), 1300)
    return () => window.clearTimeout(timer)
  }, [tick])

  if (!burst || !isDecoThemeId(decoTheme)) return null
  const { accent } = DECO_THEMES[decoTheme]
  const colors = ["#ffffff", accent]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[59] overflow-hidden"
    >
      {Array.from({ length: BURST_COUNT }, (_, index) => {
        const spread = (index - (BURST_COUNT - 1) / 2) * 24
        return (
          <m.span
            key={`${burst}-${index}`}
            className="absolute bottom-24 left-1/2 size-2.5 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{
              x: spread,
              y: -120 - (index % 4) * 30,
              opacity: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.9,
              delay: (index % 5) * 0.04,
              ease: "easeOut",
            }}
          />
        )
      })}
    </div>
  )
}
