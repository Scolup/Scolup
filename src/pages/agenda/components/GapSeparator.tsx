import { HugeiconsIcon } from "@hugeicons/react"
import { Apple01Icon, Coffee01Icon } from "@hugeicons/core-free-icons"
import { hoursLabel } from "@/services/dates"
import type { Gap } from "../helpers"

export function GapSeparator({ gap, bare }: { gap: Gap; bare?: boolean }) {
  return (
    <div className="flex w-full items-center gap-2.5">
      {!bare && <span className="w-14 shrink-0" />}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5">
        <HugeiconsIcon
          icon={gap.midday ? Apple01Icon : Coffee01Icon}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="truncate text-xs text-muted-foreground">
          {gap.label}
        </span>
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {hoursLabel(gap.end - gap.start)}
        </span>
      </div>
    </div>
  )
}
