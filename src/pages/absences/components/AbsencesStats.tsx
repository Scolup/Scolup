import { StatCard } from "@/components/StatCard"
import type { AttendanceStats } from "../types"
import { formatMinutes } from "../stats"

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
