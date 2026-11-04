interface RawDocument {
  id?: number
  libelle?: string
  taille?: number
  type?: string
  date?: Date
}

export interface RawComment {
  id?: number
  auteur?: string
  message?: string
  date?: Date
  supprime?: boolean
}

export interface RawAssignment {
  idDevoir?: number
  contenu?: string
  donneLe?: Date

  effectue?: boolean | string | number
  rendreEnLigne?: boolean
  documents?: RawDocument[]
  commentaires?: RawComment[]
}

export interface RawSubjectEntry {
  id?: number
  idDevoir?: number
  matiere?: string
  codeMatiere?: string
  nomProf?: string
  interrogation?: boolean
  aFaire?: RawAssignment | boolean
  donneLe?: Date

  effectue?: boolean | string | number
  rendreEnLigne?: boolean
}

export interface HomeworkDocument {
  id: number
  name: string
  type: string
  size?: number
}

export interface HomeworkComment {
  id: number
  author?: string
  message?: string
  date?: Date
}

export interface Assignment {
  key: string
  id: number
  due: Date
  dueKey: string
  subject: string
  subjectCode?: string

  color?: string
  teacher?: string

  content?: string

  givenOn?: Date
  done: boolean
  isTest: boolean
  onlineSubmission: boolean
  documents: HomeworkDocument[]
  comments: HomeworkComment[]
}

export interface DayGroup {
  key: string
  date: Date
  assignments: Assignment[]
}

export type AssignmentsSetter = (
  updater: (prev: Assignment[]) => Assignment[]
) => void
