import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { AttendanceEvent } from "../helpers"

export function AttendanceRow({
  event,
  last,
}: {
  event: AttendanceEvent
  last: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 px-4 py-3",
        !last && "border-b border-border/60"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-card-foreground">
          {event.reason || "Sans motif"}
        </span>
        {event.displayDate && (
          <span className="text-xs text-muted-foreground">
            {event.displayDate}
          </span>
        )}
        {event.comment && (
          <span className="truncate text-xs text-muted-foreground italic">
            {event.comment}
          </span>
        )}
        {event.justification && (
          <span className="truncate text-[11px] text-muted-foreground">
            {event.justification}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {event.label && (
          <Badge
            variant={event.justified ? "outline" : "destructive"}
            size="sm"
            pill
            aria-label={`${event.label}${event.justified ? ", justifiée" : ", non justifiée"}`}
          >
            {event.label}
          </Badge>
        )}
        {!event.justified && (
          <span className="text-[11px] font-medium text-destructive">
            Non justifiée
          </span>
        )}
      </div>
    </div>
  )
}
