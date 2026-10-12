type AttendanceKind = "Absence" | "Retard"

export interface AttendanceEvent {
  key: string
  kind: AttendanceKind
  date?: Date
  displayDate: string
  label: string
  reason: string
  comment?: string
  justification?: string
  justified: boolean
  minutes?: number
}

export interface MiscEvent {
  key: string
  title: string
  subtitle: string
  detail?: string
}

export interface AttendanceStats {
  absences: AttendanceEvent[]
  retards: AttendanceEvent[]
  unjustified: number
  retardMinutes: number
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value !== "string" || !value.trim()) return undefined
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function parseRetardMinutes(libelle: string): number | undefined {
  const hm = libelle.match(/(\d+)\s*:\s*(\d{1,2})/)
  if (hm) return Number(hm[1]) * 60 + Number(hm[2])
  const min = libelle.match(/(\d+)\s*min/)
  return min ? Number(min[1]) : undefined
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`
  const minutes = String(total % 60).padStart(2, "0")
  return `${Math.floor(total / 60)} h ${minutes}`
}

function toEvent(
  raw: Record<string, unknown>,
  index: number
): AttendanceEvent | null {
  if (raw.typeElement !== "Absence" && raw.typeElement !== "Retard") {
    return null
  }
  const kind: AttendanceKind =
    raw.typeElement === "Retard" ? "Retard" : "Absence"
  const label = asString(raw.libelle)
  const reason = asString(raw.motif)
  const comment = asString(raw.commentaire)
  return {
    key: String((raw.id as number | string | undefined) ?? `${kind}-${index}`),
    kind,
    date: asDate(raw.date),
    displayDate: asString(raw.displayDate) || asString(raw.date),
    label,
    reason,
    comment: comment && comment !== reason ? comment : undefined,
    justification: asString(raw.typeJustification) || undefined,
    justified: raw.justifie === true,
    minutes: kind === "Retard" ? parseRetardMinutes(label) : undefined,
  }
}

function toMiscEvent(
  raw: Record<string, unknown>,
  index: number,
  fallback: string
): MiscEvent {
  const title =
    asString(raw.libelle) ||
    asString(raw.titre) ||
    asString(raw.nature) ||
    asString(raw.motif) ||
    asString(raw.matiere) ||
    fallback
  const detail =
    asString(raw.commentaire) ||
    asString(raw.motif) ||
    asString(raw.description) ||
    undefined
  return {
    key: String(
      (raw.id as number | string | undefined) ?? `${fallback}-${index}`
    ),
    title,
    subtitle: asString(raw.displayDate) || asString(raw.date),
    detail: detail && detail !== title ? detail : undefined,
  }
}

export interface AttendancePayload {
  events: AttendanceEvent[]
  sanctions: MiscEvent[]
  dispenses: MiscEvent[]
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

export function isEmptyAttendance(payload: AttendancePayload): boolean {
  return (
    payload.events.length === 0 &&
    payload.sanctions.length === 0 &&
    payload.dispenses.length === 0
  )
}

export function parseAttendance(payload: {
  absencesRetards?: unknown
  sanctionsEncouragements?: unknown
  dispenses?: unknown
}): AttendancePayload {
  const rawEvents = Array.isArray(payload.absencesRetards)
    ? (payload.absencesRetards as Record<string, unknown>[])
    : []
  const rawSanctions = Array.isArray(payload.sanctionsEncouragements)
    ? (payload.sanctionsEncouragements as Record<string, unknown>[])
    : []
  const rawDispenses = Array.isArray(payload.dispenses)
    ? (payload.dispenses as Record<string, unknown>[])
    : []

  return {
    events: rawEvents
      .map(toEvent)
      .filter((event): event is AttendanceEvent => event !== null)
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)),
    sanctions: rawSanctions.map((entry, index) =>
      toMiscEvent(entry, index, "Sanction")
    ),
    dispenses: rawDispenses.map((entry, index) =>
      toMiscEvent(entry, index, "Dispense")
    ),
  }
}

export function isNoAttendanceData(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "210"
}
