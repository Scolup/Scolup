import { m } from "motion/react"
import { cn } from "@/lib/utils"

export type RubisTab = "quests" | "shop"

const TABS: { value: RubisTab; label: string }[] = [
  { value: "quests", label: "Quêtes" },
  { value: "shop", label: "Boutique" },
]

// Same segmented pill as the agenda's day/week switch: a sliding thumb on a
// muted track, compact enough to sit in the header.
export function RubisTabs({
  value,
  onChange,
  className,
  buttonClassName,
}: {
  value: RubisTab
  onChange: (tab: RubisTab) => void
  className?: string
  buttonClassName?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Quêtes et boutique"
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full bg-input/50 p-0.5",
        className
      )}
    >
      {TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/30",
              buttonClassName,
              active
                ? "text-card-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <m.span
                layoutId="rubis-tab-pill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
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
