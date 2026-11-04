import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CandyIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { DECO_THEMES, isDecoThemeId } from "@/features/shop/decoThemes"

// Themed decorations of the active deco theme (shop "thèmes"). You mount
// <DecoMascot /> inside a positioned card and <DecoSprinkles /> at the end of
// a page; both render nothing when no theme is active.

// A character perched on the card edge (like a witch sitting on the grades
// card at Halloween). Each widget picks its own variant (0 = grades card,
// 1 = homework card).
export function DecoMascot({ variant = 0 }: { variant?: number }) {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  const mascots = DECO_THEMES[decoTheme].mascots
  const mascot = mascots[variant] ?? mascots[0]

  return (
    <m.span
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-10", mascot.className)}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <HugeiconsIcon icon={mascot.icon} className="size-full" />
    </m.span>
  )
}

// A row of small objects lined up on the "ground" at the bottom of a page.
export function DecoSprinkles() {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  const scatter = DECO_THEMES[decoTheme].scatter

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex items-end justify-center gap-5 px-4 pt-10 pb-4"
    >
      {scatter.map((charm, index) => (
        <m.span
          key={charm.className}
          className="shrink-0"
          animate={charm.float ? { y: [0, -6, 0] } : undefined}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
          }}
        >
          <HugeiconsIcon icon={charm.icon} className={charm.className} />
        </m.span>
      ))}
    </div>
  )
}

// A visible charm hung on a list page itself: the stickers show up without
// scrolling (in the grades and messages bars, on top of the homework page),
// so those pages feel decorated right away. The caller provides the position;
// the theme provides the look.
export function DecoSticker({
  charm = 0,
  className,
}: {
  charm?: number
  className: string
}) {
  const { decoTheme } = useTheme()
  if (!isDecoThemeId(decoTheme)) return null
  const stickers = DECO_THEMES[decoTheme].stickers
  const sticker = stickers[charm % stickers.length]

  return (
    <m.span
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-10", className)}
      animate={{ y: [0, -3, 0] }}
      transition={{
        duration: 2.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: charm * 0.6,
      }}
    >
      <HugeiconsIcon icon={sticker.icon} className={sticker.className} />
    </m.span>
  )
}

// Whole-app falling weather of the festive themes: snow dots for Noël,
// candy rain for Halloween. One mount at the App root (a plain, untransformed
// ancestor): the fixed negative-z layer paints right above the app
// background and below every card, so particles glide out of sight behind
// anything opaque. White flakes stay visible on the pure-white background
// thanks to a soft icy halo; candies are colored icons.
const PARTICLE_POSITIONS = [
  "2%",
  "7%",
  "12%",
  "17%",
  "22%",
  "27%",
  "32%",
  "37%",
  "42%",
  "47%",
  "52%",
  "57%",
  "62%",
  "67%",
  "72%",
  "77%",
  "82%",
  "87%",
  "92%",
  "97%",
]
const SNOW_SIZES = [
  "size-1",
  "size-1.5",
  "size-2",
  "size-2.5",
  "size-1.5",
  "size-1",
]

// The candy rain: fewer, bigger, spinning, in candy-shop colors that read
// on both the white and the dark background.
const CANDY_POSITIONS = [
  "4%",
  "13%",
  "22%",
  "31%",
  "40%",
  "49%",
  "58%",
  "67%",
  "76%",
  "85%",
  "94%",
]
const CANDY_SIZES = ["size-3", "size-4", "size-3.5", "size-3", "size-4"]
const CANDY_COLORS = ["#f97316", "#fb7185", "#c4b5fd", "#fbbf24", "#4ade80"]

export function DecoParticles() {
  const { decoTheme } = useTheme()
  const theme = isDecoThemeId(decoTheme) ? DECO_THEMES[decoTheme] : undefined
  if (!theme || (!theme.snow && !theme.candies)) return null

  const layer = "pointer-events-none fixed inset-0 -z-10 overflow-hidden"

  if (theme.candies) {
    return (
      <div aria-hidden="true" className={layer}>
        {CANDY_POSITIONS.map((left, index) => (
          <m.span
            key={left}
            style={{ left, color: CANDY_COLORS[index % CANDY_COLORS.length] }}
            className={cn(
              "absolute top-0",
              CANDY_SIZES[index % CANDY_SIZES.length]
            )}
            animate={{
              y: [-24, 1600],
              x: [0, 14, -10, 0],
              rotate: [0, index % 2 ? 220 : -220],
            }}
            transition={{
              duration: 12 + (index % 5) * 1.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 1.1,
            }}
          >
            <HugeiconsIcon icon={CandyIcon} className="size-full" />
          </m.span>
        ))}
      </div>
    )
  }

  return (
    <div aria-hidden="true" className={layer}>
      {PARTICLE_POSITIONS.map((left, index) => (
        <m.span
          key={left}
          style={{ left }}
          className={cn(
            "absolute top-0 rounded-full bg-white",
            "shadow-[0_0_3px_1px_rgba(148,163,184,0.9)]",
            "dark:bg-white/90 dark:shadow-[0_0_4px_2px_rgba(255,255,255,0.25)]",
            SNOW_SIZES[index % SNOW_SIZES.length]
          )}
          // NOTE: fixed travel distance (px), not vh: motion interpolates
          // the fall reliably everywhere; on very tall screens flakes simply
          // leave the view before restarting.
          animate={{ y: [-12, 1600], x: [0, 18, -8, 0] }}
          transition={{
            duration: 10 + (index % 5) * 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
          }}
        />
      ))}
    </div>
  )
}
