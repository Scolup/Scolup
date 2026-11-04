import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BalloonsIcon,
  CandyCaneIcon,
  CandyIcon,
  GhostIcon,
  HourglassIcon,
  MoonStarIcon,
  PineTreeIcon,
  PumpkinIcon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface Ornament {
  icon: typeof PumpkinIcon
  className: string
  float?: boolean
}

interface BannerStyle {
  className: string
  tease: string
  ornaments: Ornament[]
  snow?: boolean // falling snow dots on the Christmas banner
  treats?: boolean // falling candies spinning on the Halloween banner
  // Little floating balls of color, one per entry: the color shelf of the
  // "épicerie" banner.
  dots?: string[]
}

// Decorative headers of the collections: the ornaments hang there so the
// cards below can stay sober (color bubble + name only).
const BANNERS: Record<string, BannerStyle> = {
  noel: {
    className: "bg-gradient-to-r from-red-950 via-red-900 to-red-800",
    tease: "Les fêtes arrivent : saisis les couleurs de décembre en premier.",
    ornaments: [
      {
        icon: PineTreeIcon,
        className: "right-6 -bottom-1 size-20 rotate-3 text-white/20",
      },
      {
        icon: PineTreeIcon,
        className: "right-28 bottom-0 size-12 -rotate-6 text-white/25",
        float: true,
      },
      {
        icon: CandyCaneIcon,
        className: "right-3 top-2 size-8 rotate-12 text-white/45",
        float: true,
      },
    ],
    snow: true,
  },
  halloween: {
    className: "bg-gradient-to-r from-[#2e1065] via-[#5b21b6] to-[#c2410c]",
    tease: "Édition limitée : les prix réduits s'envolent à minuit.",
    ornaments: [
      {
        icon: PumpkinIcon,
        className: "right-1 -bottom-4 size-20 -rotate-12 text-orange-300/30",
        float: true,
      },
      {
        icon: GhostIcon,
        className: "right-28 top-1.5 size-10 rotate-6 text-white/25",
        float: true,
      },
      {
        icon: MoonStarIcon,
        className: "right-14 bottom-1 size-7 text-white/30",
      },
    ],
    treats: true,
  },
  colors: {
    className: "bg-gradient-to-r from-violet-600 via-teal-600 to-pink-600",
    tease:
      "Une couleur ou un thème pour chaque humeur, à débloquer quand tu veux.",
    ornaments: [
      {
        icon: BalloonsIcon,
        className: "right-4 -bottom-2 size-16 text-white/40",
        float: true,
      },
      {
        icon: StarIcon,
        className: "right-24 top-2 size-7 text-white/45",
        float: true,
      },
      {
        icon: StarIcon,
        className: "left-[26%] top-2.5 size-5 text-white/35",
        float: true,
      },
    ],
    dots: ["#fbbf24", "#7dd3fc", "#a7f3d0", "#fda4af", "#c4b5fd"],
  },
}

const SNOW_POSITIONS = ["12%", "30%", "48%", "66%", "84%"]

// Horizontal spots of the floating color dots (see the colors banner).
const DOTS_POSITIONS = ["10%", "25%", "40%", "55%", "70%"]

// The Halloween candy rain: fall spots and a candy-colored palette that
// reads on the dark night gradient.
const TREAT_POSITIONS = ["14%", "30%", "48%", "64%", "80%"]
const TREAT_COLORS = ["#fbbf24", "#fb7185", "#c4b5fd"]

export function CollectionBanner({
  id,
  label,
  hint,
  countdown,
}: {
  id: string
  label: string
  hint: string
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
      {style.ornaments.map((ornament, index) => (
        <m.span
          key={ornament.className}
          aria-hidden="true"
          className={cn("absolute", ornament.className)}
          animate={ornament.float ? { y: [0, -6, 0] } : undefined}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4,
          }}
        >
          <HugeiconsIcon
            icon={ornament.icon}
            aria-hidden="true"
            className="size-full"
          />
        </m.span>
      ))}

      {style.snow &&
        SNOW_POSITIONS.map((left, index) => (
          <m.span
            key={`snow-${index}`}
            aria-hidden="true"
            style={{ left }}
            className="absolute top-0 size-1.5 rounded-full bg-white/80"
            animate={{ y: [0, 96], opacity: [0, 1, 0] }}
            transition={{
              duration: 2.8 + index * 0.4,
              repeat: Infinity,
              delay: index * 0.55,
              ease: "linear",
            }}
          />
        ))}

      {style.treats &&
        TREAT_POSITIONS.map((left, index) => (
          <m.span
            key={`treat-${index}`}
            aria-hidden="true"
            style={{ left, color: TREAT_COLORS[index % TREAT_COLORS.length] }}
            className="absolute top-0"
            animate={{
              y: [0, 96],
              opacity: [0, 1, 1, 0],
              rotate: index % 2 ? [0, -220] : [0, 220],
            }}
            transition={{
              duration: 3.2 + index * 0.4,
              repeat: Infinity,
              delay: index * 0.8,
              ease: "linear",
            }}
          >
            <HugeiconsIcon
              icon={CandyIcon}
              aria-hidden="true"
              className={index % 2 ? "size-5" : "size-4"}
            />
          </m.span>
        ))}

      {style.dots?.map((color, index) => (
        <m.span
          key={`dot-${color}`}
          aria-hidden="true"
          style={{ backgroundColor: color, left: DOTS_POSITIONS[index] }}
          className="absolute bottom-2.5 size-3.5 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 2.6 + index * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.45,
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
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
            {hint}
          </span>
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
