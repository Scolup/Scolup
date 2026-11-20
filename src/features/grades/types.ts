export interface Competency {
  key: string
  level: number | null
  label: string
}

export interface Grade {
  key: string
  subject: string
  subjectCode?: string
  title: string
  typeDevoir?: string
  comment?: string
  date?: Date
  enteredOn?: Date
  value: string
  outOf: string
  coef: string
  period: string
  competencies: Competency[]
  nonSignificant: boolean
  classAverage?: number
}

export interface SubjectGroup {
  subject: string
  subjectCode?: string
  grades: Grade[]
  average: number | null
  classAverage?: number
  coef: number
}

// Résolveur de coefficient d'une matière (code, libellé) — injecté depuis
// l'extérieur pour garder ce fichier sans dépendance.
export type SubjectCoefOf = (
  subjectCode: string | undefined,
  subject: string
) => number

// Écart de moyenne (sur 20) entre la note comptée et la note retirée. `null`
// quand la moyenne ne peut pas être calculée sans elle.
export interface GradeImpact {
  general: number | null
  subject: number | null
}

export interface Period {
  id: string
  label: string
  annuel?: boolean
}

export interface OfficialAverages {
  student?: number
  classAverage?: number
  subjects: Record<string, { student?: number; classAverage?: number }>
}

export interface TrendNewcomer {
  key: string
  title: string
  display: string
  impact: number
}

export interface TrendPoint {
  key: string
  label: string
  fullLabel: string
  average: number | null
  delta: number | null
  newcomers: TrendNewcomer[]
}

export type AverageMethod = "subject" | "weighted" | "median"

export type AverageScale = 20 | 10 | 100
