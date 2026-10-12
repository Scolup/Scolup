import { cn } from "@/lib/utils"
import type { MiscEvent } from "../helpers"

export function MiscRow({ event, last }: { event: MiscEvent; last: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-14 flex-col gap-0.5 px-4 py-3",
        !last && "border-b border-border/60"
      )}
    >
      <span className="truncate text-sm font-medium text-card-foreground">
        {event.title}
      </span>
      {event.subtitle && (
        <span className="text-xs text-muted-foreground">{event.subtitle}</span>
      )}
      {event.detail && (
        <span className="truncate text-xs text-muted-foreground italic">
          {event.detail}
        </span>
      )}
    </div>
  )
}
