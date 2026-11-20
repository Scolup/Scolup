import { withPronote } from "@/services/litenote"
import type { AttendanceEvent, AttendancePayload } from "./types"

export async function fetchPronoteAttendance(): Promise<AttendancePayload> {
  const notebook = await withPronote((client) => client.attendance())
  const date = (value: Date) => value.toLocaleDateString("fr-FR")
  const events: AttendanceEvent[] = [
    ...(notebook?.absences ?? []).map(
      (entry): AttendanceEvent => ({
        key: "pn:absence:" + entry.id,
        kind: "Absence",
        date: entry.startDate,
        displayDate: date(entry.startDate),
        label: "Absence",
        reason: entry.reason ?? "",
        justified: entry.justified,
        minutes: entry.hoursMissed * 60 + entry.minutesMissed,
      })
    ),
    ...(notebook?.delays ?? []).map(
      (entry): AttendanceEvent => ({
        key: "pn:retard:" + entry.id,
        kind: "Retard",
        date: entry.date,
        displayDate: date(entry.date),
        label: "Retard",
        reason: entry.reason ?? "",
        justified: entry.justified,
        minutes: entry.minutes,
        justification: entry.justification,
      })
    ),
  ]
  return {
    events: events.sort(
      (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
    ),
    sanctions: (notebook?.punishments ?? []).map((entry) => ({
      key: "pn:" + entry.id,
      title: entry.title,
      subtitle: date(entry.dateGiven),
      detail: entry.reasons.join(", "),
    })),
    dispenses: [],
  }
}
