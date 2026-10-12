import { Skeleton } from "@/components/ui/skeleton"

export function WidgetSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section
      aria-hidden="true"
      className="flex flex-col gap-2 rounded-3xl border border-border/70 bg-card p-4"
    >
      {Array.from({ length: rows }, (_, row) => (
        <Skeleton key={row} className="h-16 w-full rounded-2xl" />
      ))}
    </section>
  )
}
