export type AttendanceKind = "Absence" | "Retard"

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

export interface AttendancePayload {
  events: AttendanceEvent[]
  sanctions: MiscEvent[]
  dispenses: MiscEvent[]
}
