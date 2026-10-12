import { cn } from "@/lib/utils"
import type { AttendanceStats } from "../helpers"
import { formatMinutes } from "../helpers"

function StatCard({
  value,
  label,
  accent,
}: {
  value: string
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

export function AbsencesStats({ stats }: { stats: AttendanceStats }) {
  return (
    <div aria-label="Résumé" className="grid grid-cols-3 gap-2">
      <StatCard
        value={String(stats.absences.length)}
        label={stats.absences.length > 1 ? "Absences" : "Absence"}
      />
      <StatCard
        value={String(stats.retards.length)}
        label={stats.retards.length > 1 ? "Retards" : "Retard"}
      />
      <StatCard
        value={
          stats.retardMinutes > 0
            ? formatMinutes(stats.retardMinutes)
            : String(stats.unjustified)
        }
        label={stats.retardMinutes > 0 ? "Retard cumulé" : "Non justifiés"}
        accent={stats.retardMinutes === 0 && stats.unjustified > 0}
      />
    </div>
  )
}
