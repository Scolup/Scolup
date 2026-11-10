import type { AttendanceStats, AttendancePayload } from "./types"

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`
  const minutes = String(total % 60).padStart(2, "0")
  return `${Math.floor(total / 60)} h ${minutes}`
}

export function attendanceStats({
  events,
}: AttendancePayload): AttendanceStats {
  const retards = events.filter((event) => event.kind === "Retard")
  return {
    absences: events.filter((event) => event.kind === "Absence"),
    retards,
    unjustified: events.filter((event) => !event.justified).length,
    retardMinutes: retards.reduce((sum, r) => sum + (r.minutes ?? 0), 0),
  }
}
