import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { HourglassIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface BannerStyle {
  className: string
  tease: string
  snow?: boolean // falling snow on the Christmas banner
}

// Decorative headers of the collections: a gradient, and for Christmas the
// snowfall, so the cards below can stay sober (color bubble + name only).
const BANNERS: Record<string, BannerStyle> = {
  noel: {
    className: "bg-gradient-to-r from-red-950 via-red-900 to-red-800",
    tease:
      "Les fêtes arrivent : saisis les couleurs de décembre avant qu'elles partent.",
    snow: true,
  },
  halloween: {
    className: "bg-gradient-to-r from-[#2e1065] via-[#5b21b6] to-[#c2410c]",
    tease: "Édition limitée : les prix réduits s'envolent à minuit.",
  },
  colors: {
    className: "bg-gradient-to-r from-violet-600 via-teal-600 to-pink-600",
    tease:
      "Une couleur ou un thème pour chaque humeur, à débloquer quand tu veux.",
  },
}

// The Christmas banner snowfall: plain circles at irregular spots, varied
// sizes and a gentle sway.
const SNOW: {
  left: string
  size: string
  duration: number
  delay: number
}[] = [
  { left: "6%", size: "size-1.5", duration: 3.4, delay: 0.6 },
  { left: "14%", size: "size-2", duration: 2.9, delay: 1.4 },
  { left: "25%", size: "size-1.5", duration: 3.8, delay: 0.2 },
  { left: "37%", size: "size-2.5", duration: 3.1, delay: 1.1 },
  { left: "49%", size: "size-2", duration: 3.6, delay: 0.9 },
  { left: "60%", size: "size-3", duration: 4.2, delay: 0.4 },
  { left: "72%", size: "size-1.5", duration: 3.3, delay: 1.7 },
  { left: "83%", size: "size-2.5", duration: 3.9, delay: 0.1 },
  { left: "92%", size: "size-2", duration: 3, delay: 1.2 },
]

export function CollectionBanner({
  id,
  label,
  countdown,
}: {
  id: string
  label: string
  countdown?: string
}) {
  const style = BANNERS[id]

  if (!style) {
    // Unknown collection: a quiet banner so the section keeps a header.
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3.5">
        <h2
          id={`collection-${id}`}
          className="text-base font-semibold text-foreground"
        >
          {label}
        </h2>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative col-span-2 h-24 overflow-hidden rounded-2xl px-4 py-3.5",
        style.className
      )}
    >
      {style.snow &&
        SNOW.map((flake) => (
          <m.span
            key={`snow-${flake.left}`}
            aria-hidden="true"
            style={{ left: flake.left }}
            className={cn(
              "absolute top-0 rounded-full bg-white/80",
              flake.size
            )}
            animate={{ y: [0, 96], opacity: [0, 1, 1, 0], x: [0, 5, -3, 0] }}
            transition={{
              duration: flake.duration,
              repeat: Infinity,
              delay: flake.delay,
              ease: "linear",
            }}
          />
        ))}

      <div className="relative flex h-full flex-col justify-center gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id={`collection-${id}`}
            className="text-base font-semibold text-white"
          >
            {label}
          </h2>
          {countdown && (
            <span className="flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
              <HugeiconsIcon
                icon={HourglassIcon}
                aria-hidden="true"
                className="size-3.5"
              />
              Fin dans {countdown}
            </span>
          )}
        </div>
        <p className="max-w-[75%] text-xs text-white/80">{style.tease}</p>
      </div>
    </div>
  )
}
