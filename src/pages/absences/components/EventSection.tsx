import { Fragment, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Award02Icon } from "@hugeicons/core-free-icons"

export function EventSection<T extends { key: string }>({
  title,
  icon,
  events,
  renderRow,
}: {
  title: string
  icon: typeof Award02Icon
  events: T[]
  renderRow: (event: T, last: boolean) => ReactNode
}) {
  return (
    <section aria-label={title}>
      <h2 className="flex items-center gap-2 px-1 pb-2">
        <HugeiconsIcon
          icon={icon}
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="flex-1 text-sm font-semibold text-card-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {events.length}
        </span>
      </h2>
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
        {events.map((event, index) => (
          <Fragment key={event.key}>
            {renderRow(event, index === events.length - 1)}
          </Fragment>
        ))}
      </div>
    </section>
  )
}
