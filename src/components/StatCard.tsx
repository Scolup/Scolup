import { cn } from "@/lib/utils"

export function StatCard({
  value,
  label,
  accent,
}: {
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-border/70 bg-card px-2 py-3 text-center">
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          accent ? "text-destructive" : "text-card-foreground"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
