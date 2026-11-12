import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

const PALETTES = [
  ["#d09145", "#ac622d", "#693422"],
  ["#62a9e5", "#3870b5", "#234477"],
  ["#b88bef", "#8051c7", "#542d8d"],
  ["#f18ebd", "#c64b90", "#84296a"],
  ["#ffb443", "#e27726", "#a64422"],
]

export function ChestArt({
  tier,
  open = false,
  className,
}: {
  tier: number
  open?: boolean
  className?: string
}) {
  const [light, mid, deep] = PALETTES[Math.max(0, tier)] ?? PALETTES[0]
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block h-[0.78em] w-[1em] shrink-0",
        tier < 0 && "grayscale",
        className
      )}
      style={
        {
          "--chest-light": light,
          "--chest-mid": mid,
          "--chest-deep": deep,
        } as CSSProperties
      }
    >
      <span className="absolute inset-x-[11%] top-[39%] bottom-[8%] rounded-[0.10em] border-[0.024em] border-amber-950/30 bg-linear-to-b from-(--chest-mid) to-(--chest-deep) shadow-[inset_0_0.045em_0_#0003,0_0.045em_0_var(--chest-deep)]" />
      <span className="absolute inset-x-[11%] top-[63%] h-[2%] bg-amber-950/18" />
      <span className="absolute top-[36%] bottom-[9%] left-[16%] w-[13%] rounded-b-[0.045em] bg-linear-to-r from-amber-400 via-yellow-200 to-amber-600 shadow-[0.012em_0_0_#0003]" />
      <span className="absolute top-[36%] right-[16%] bottom-[9%] w-[13%] rounded-b-[0.045em] bg-linear-to-r from-amber-400 via-yellow-200 to-amber-600 shadow-[0.012em_0_0_#0003]" />
      <span
        className={cn(
          "absolute inset-x-[7%] top-[11%] h-[38%] origin-[18%_100%] overflow-hidden rounded-t-[0.15em] rounded-b-[0.045em] border-[0.024em] border-amber-950/30 bg-linear-to-b from-(--chest-light) to-(--chest-mid) shadow-[inset_0_0.02em_0_#fff6,0_0.022em_0_#0004] transition-transform motion-reduce:transition-none",
          open && "-translate-y-[35%] -rotate-16"
        )}
      >
        <span className="absolute inset-x-[9%] top-[17%] h-[14%] rounded-full bg-white/25" />
        <span className="absolute inset-y-0 left-[8%] w-[17%] bg-linear-to-r from-amber-400 via-yellow-100 to-amber-500" />
        <span className="absolute inset-y-0 right-[8%] w-[17%] bg-linear-to-r from-amber-400 via-yellow-100 to-amber-500" />
      </span>
      <span className="absolute top-[37%] left-1/2 grid h-[24%] w-[20%] -translate-x-1/2 place-items-center rounded-[0.055em] border-[0.018em] border-amber-900/35 bg-linear-to-b from-yellow-100 to-amber-500 shadow-[0_0.018em_0_#0004]">
        <span className="h-[48%] w-[20%] rounded-full bg-amber-900/80" />
      </span>
    </span>
  )
}
