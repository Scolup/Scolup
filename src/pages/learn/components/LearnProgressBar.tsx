import { cn } from "@/lib/utils"

export function LearnProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number
  max: number
  label: string
  className?: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative h-3.5 overflow-hidden rounded-full bg-muted shadow-inner",
        className
      )}
    >
      <div
        className="absolute inset-0 origin-left rounded-full bg-emerald-500 transition-transform duration-300 motion-reduce:transition-none"
        style={{ transform: `scaleX(${value / max})` }}
      >
        <div className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  )
}
