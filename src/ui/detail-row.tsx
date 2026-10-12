import { HugeiconsIcon } from "@hugeicons/react"
import type { DoorIcon } from "@hugeicons/core-free-icons"
import type { ReactNode } from "react"

export function DetailRow({
  icon,
  label,
  value,
}: {
  icon: typeof DoorIcon
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-input/60 text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        {typeof value === "string" ? (
          <span className="text-sm break-words text-card-foreground">
            {value}
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  )
}
