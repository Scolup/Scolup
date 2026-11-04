import { GhostIcon } from "@hugeicons/core-free-icons"

export interface RawCourse {
  id?: number
  text?: string
  matiere?: string
  classe?: string
  codeMatiere?: string
  typeCours?: string
  start_date?: Date | string
  end_date?: Date | string
  color?: string
  prof?: string
  salle?: string
  groupe?: string
  isAnnule?: boolean
  isModifie?: boolean
  dispense?: number
  contenuDeSeance?: boolean
  devoirAFaire?: boolean
}

export type CourseKind = "lunch" | "break" | "course"

export type CourseStatus = "online" | "evaluated"

export interface Course {
  key: string
  stableId: string
  id: number
  title: string
  subjectCode?: string
  kind: CourseKind
  status?: CourseStatus
  details?: string
  start: Date | null
  end: Date | null
  color?: string
  teacher?: string
  room?: string
  group?: string
  cancelled: boolean
  modified: boolean
  hasHomework: boolean
  hasLessonContent: boolean
}

export type AgendaView = "day" | "week"

export type TimedCourse = Course & { start: Date; end: Date }

export interface Gap {
  key: string
  start: number
  end: number
  midday: boolean
  label: string
}

export interface CourseFlag {
  key:
    | "cancelled"
    | "modified"
    | "online"
    | "evaluated"
    | "homework"
    | "session"
  label: string
  icon?: typeof GhostIcon
  tone: "destructive" | "warning" | "info" | "secondary"
}
