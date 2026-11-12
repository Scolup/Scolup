import type { CSSProperties } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { DECO_THEMES, isDecoThemeId } from "@/features/shop/decoThemes"

// The active deco theme (shop "thèmes"). A theme is a whole-app identity, not
// a sticker pack: its hue repaints every surface (see ThemeProvider),
// <DecoParticles /> lays its weather over every screen (only Christmas has
// one), <DecoMotif /> gives the home hero a stronger signature. Both render nothing
// when no theme is active. The reward celebration lives in RewardBurst.

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
      { left: "5%", size: "size-1.5", duration: 29, delay: 4 },
      { left: "21%", size: "size-2", duration: 26, delay: 11 },
      { left: "44%", size: "size-1.5", duration: 30, delay: 9 },
      { left: "63%", size: "size-2", duration: 27, delay: 15 },
      { left: "88%", size: "size-1.5", duration: 29, delay: 13 },
    ],
  },
  {
    // The classic snow dots.
    className: "bg-slate-300 dark:bg-white/75",
    sway: [10, 5],
    flakes: [
      { left: "8%", size: "size-2.5", duration: 17, delay: 3 },
      { left: "27%", size: "size-3", duration: 15, delay: 8 },
      { left: "52%", size: "size-2.5", duration: 18, delay: 6 },
      { left: "73%", size: "size-3", duration: 15, delay: 10 },
      { left: "93%", size: "size-2.5", duration: 19, delay: 13 },
    ],
  },
  {
    // Near flakes: the biggest and the quickest.
    className: "bg-slate-400 dark:bg-white/95",
    sway: [16, 9],
    flakes: [
      { left: "14%", size: "size-3.5", duration: 12, delay: 5 },
      { left: "47%", size: "size-4", duration: 10, delay: 9 },
      { left: "81%", size: "size-3.5", duration: 13, delay: 0 },
    ],
  },
]

// The single motif, cropped into the top-right of the home hero gradient.
export function DecoMotif() {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  const { motif, accent } = DECO_THEMES[decoTheme]

  return (
    <span
      aria-hidden="true"
      data-deco-motion
      className="pointer-events-none absolute -top-12 -right-8 animate-[motif-float_6s_ease-in-out_infinite] opacity-30 dark:opacity-40"
    >
      <HugeiconsIcon
        icon={motif}
        style={{ color: accent }}
        className="size-56"
      />
    </span>
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
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden motion-reduce:hidden"
    >
      <Snow />
    </div>
  )
}

// Plain snow circles, no glow: slate-tinted in the light and white in the
// dark, so they stay readable on the pure-white background.
// Pure CSS (see snow-fall / snow-sway in index.css): the fall is a transform
// and the sway the individual `translate` property, both run on the
// compositor, so the snow costs no JavaScript and no main-thread frame. The
// delays are negative so the sky is already full when the screen opens.
function Snow() {
  return (
    <>
      {SNOW_LAYERS.flatMap((layer) =>
        layer.flakes.map((flake) => (
          <span
            key={flake.left}
            style={
              {
                left: flake.left,
                "--sway-a": `${layer.sway[0]}px`,
                "--sway-b": `${layer.sway[1]}px`,
                animation: `snow-fall ${flake.duration}s linear ${-flake.delay}s infinite, snow-sway ${flake.duration / 2}s ease-in-out ${-flake.delay}s infinite`,
              } as CSSProperties
            }
            className={cn(
              "absolute top-0 rounded-full will-change-transform",
              flake.size,
              layer.className
            )}
          />
        ))
      )}
    </>
  )
}
