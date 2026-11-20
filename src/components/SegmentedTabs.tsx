import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { SPRING_SOFT } from "@/lib/motion"

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
  layoutId,
  className,
  buttonClassName,
}: {
  value: T
  onChange: (value: T) => void
  tabs: readonly { value: T; label: string }[]
  label: string
  layoutId: string
  className?: string
  buttonClassName?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full bg-input/50 p-0.5",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative press rounded-full px-3 py-1 text-xs font-medium outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/30",
              buttonClassName,
              active
                ? "text-card-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                transition={SPRING_SOFT}
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                aria-hidden="true"
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
