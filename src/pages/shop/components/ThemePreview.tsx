import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { DECO_THEMES, type DecoThemeId } from "@/features/shop/decoThemes"

// Miniature snowfall of the preview: plain circles like the real one (see
// DecoOrnament's Snow), a bit of each depth.
const PREVIEW_FLAKES = [
  { left: "8%", top: "12%", className: "size-1.5 opacity-60" },
  { left: "32%", top: "38%", className: "size-2.5 opacity-90" },
  { left: "58%", top: "10%", className: "size-1.5 opacity-70" },
  { left: "84%", top: "34%", className: "size-2 opacity-80" },
]

// A miniature app screen wearing the theme: the tinted surface, the motif
// wallpaper and the hero motif. The shop drawer uses it so the buyer sees
// the whole atmosphere, not a flat color.
export function ThemePreview({ id }: { id: DecoThemeId }) {
  const theme = DECO_THEMES[id]

  return (
    <div
      aria-hidden="true"
      className="relative h-32 overflow-hidden rounded-2xl border"
      style={{
        borderColor: `color-mix(in srgb, ${theme.accent} 50%, transparent)`,
        background: `radial-gradient(140% 110% at 50% -20%, color-mix(in srgb, ${theme.accent} 45%, transparent), transparent 78%)`,
      }}
    >
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 place-items-center opacity-25">
        {Array.from({ length: 15 }, (_, index) => (
          <HugeiconsIcon
            key={index}
            icon={theme.motif}
            style={{ color: theme.accent }}
            className="size-4"
          />
        ))}
      </div>

      {/* The snowing theme previews its weather; the others stay still. */}
      {theme.snow &&
        PREVIEW_FLAKES.map((flake) => (
          <span
            key={flake.left}
            style={{ left: flake.left, top: flake.top }}
            className={cn("absolute rounded-full bg-white", flake.className)}
          />
        ))}

      <div
        className="absolute inset-x-5 top-5 rounded-xl border border-black/5 p-2.5 shadow-sm dark:border-white/10"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.accent} 12%, var(--background-base))`,
        }}
      >
        <span className="block h-1.5 w-14 rounded-full bg-foreground/25" />
        <span className="mt-1.5 block h-1.5 w-20 rounded-full bg-foreground/10" />
        <span className="mt-1.5 block h-1.5 w-10 rounded-full bg-foreground/10" />
      </div>

      <HugeiconsIcon
        icon={theme.motif}
        style={{ color: theme.accent }}
        className="absolute right-3 bottom-2 size-14 opacity-80"
      />
    </div>
  )
}
