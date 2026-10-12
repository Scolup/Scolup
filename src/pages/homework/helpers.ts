import { daysUntil, fullDateLabel, parseDateKey } from "@/services/dates"
import { decodeHtmlEntities } from "@/services/html"

export interface RawDocument {
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

function isDone(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") return value === "1" || value === "true"
  return false
}

function toDocuments(files: RawDocument[] | undefined): HomeworkDocument[] {
  if (!Array.isArray(files)) return []
  return files
    .map((file): HomeworkDocument | null => {
      if (!file?.libelle) return null
      const id = Number(file.id)
      return {
        id: Number.isFinite(id) ? id : 0,
        name: file.libelle,
        type: file.type ?? "FICHIER_CDT",
        size: typeof file.taille === "number" ? file.taille : undefined,
      }
    })
    .filter((file): file is HomeworkDocument => file !== null)
}

function toComments(raw: RawComment[] | undefined): HomeworkComment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((comment) => comment && !comment.supprime)
    .map((comment) => ({
      id: Number(comment.id) || 0,
      author:
        typeof comment.auteur === "string"
          ? decodeHtmlEntities(comment.auteur)
          : comment.auteur,
      message:
        typeof comment.message === "string"
          ? decodeHtmlEntities(comment.message)
          : comment.message,
      date: comment.date instanceof Date ? comment.date : undefined,
    }))
}

function toAssignment(
  entry: RawSubjectEntry,
  dueKey: string,
  due: Date
): Assignment | null {
  const work = entry.aFaire
  if (!work) return null

  if (typeof work !== "object") {
    const id = Number(entry.idDevoir ?? entry.id)
    if (!Number.isFinite(id)) return null

    return {
      key: `${dueKey}-${id}`,
      id,
      due,
      dueKey,
      subject: entry.matiere ?? "Sans matière",
      subjectCode: entry.codeMatiere,
      teacher: entry.nomProf,
      content: undefined,
      givenOn: entry.donneLe instanceof Date ? entry.donneLe : undefined,
      done: isDone(entry.effectue),
      isTest: Boolean(entry.interrogation),
      onlineSubmission: Boolean(entry.rendreEnLigne),
      documents: [],
      comments: [],
    }
  }

  const detail = work as RawAssignment
  const id = Number(detail.idDevoir ?? entry.id)
  if (!Number.isFinite(id)) return null

  const content =
    typeof detail.contenu === "string" && detail.contenu.trim()
      ? detail.contenu
      : undefined

  return {
    key: `${dueKey}-${id}`,
    id,
    due,
    dueKey,
    subject: entry.matiere ?? "Sans matière",
    subjectCode: entry.codeMatiere,
    teacher: entry.nomProf,
    content,
    givenOn: detail.donneLe instanceof Date ? detail.donneLe : undefined,
    done: isDone(detail.effectue),
    isTest: Boolean(entry.interrogation),
    onlineSubmission: Boolean(detail.rendreEnLigne),
    documents: toDocuments(detail.documents),
    comments: toComments(detail.commentaires),
  }
}

export function normalizeCalendar(calendar: unknown): Assignment[] {
  if (!calendar || typeof calendar !== "object") return []
  const assignments: Assignment[] = []

  for (const [key, value] of Object.entries(
    calendar as Record<string, unknown>
  )) {
    const due = parseDateKey(key)
    if (!due || !Array.isArray(value)) continue
    for (const entry of value as RawSubjectEntry[]) {
      if (!entry || typeof entry !== "object") continue
      const assignment = toAssignment(entry, key, due)
      if (assignment) assignments.push(assignment)
    }
  }

  return assignments
}

export function appendComment(
  assignments: Assignment[],
  key: string,
  comment: HomeworkComment
): Assignment[] {
  return assignments.map((item) =>
    item.key === key ? { ...item, comments: [...item.comments, comment] } : item
  )
}

export function mergeDayDetails(
  prev: Assignment[],
  dueKey: string,
  parsed: Assignment[]
): Assignment[] {
  const byId = new Map(parsed.map((a) => [a.id, a]))
  return prev.map((item) => {
    if (item.dueKey !== dueKey) return item
    const full = byId.get(item.id)
    if (!full || full.content === undefined) return item
    return {
      ...item,
      content: full.content,
      documents: full.documents,
      comments: full.comments,
      givenOn: full.givenOn ?? item.givenOn,
      teacher: item.teacher ?? full.teacher,
    }
  })
}

export function groupByDay(assignments: Assignment[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()

  for (const assignment of assignments) {
    const group = groups.get(assignment.dueKey)
    if (group) group.assignments.push(assignment)
    else
      groups.set(assignment.dueKey, {
        key: assignment.dueKey,
        date: assignment.due,
        assignments: [assignment],
      })
  }

  return [...groups.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((group) => ({
      ...group,
      assignments: group.assignments.sort((a, b) =>
        a.subject.localeCompare(b.subject, "fr")
      ),
    }))
}

const RECENT_OVERDUE_DAYS = 7

export function partitionGroups(groups: DayGroup[]): {
  overdue: DayGroup[]
  staleOverdue: DayGroup[]
  upcoming: DayGroup[]
  pastDone: DayGroup[]
} {
  const overdue: DayGroup[] = []
  const staleOverdue: DayGroup[] = []
  const upcoming: DayGroup[] = []
  const pastDone: DayGroup[] = []
  for (const group of groups) {
    if (daysUntil(group.date) >= 0) {
      upcoming.push(group)
      continue
    }
    const undone = group.assignments.filter((a) => !a.done)
    const done = group.assignments.filter((a) => a.done)
    if (done.length > 0) pastDone.push({ ...group, assignments: done })
    if (undone.length === 0) continue
    const rest = { ...group, assignments: undone }
    if (daysUntil(group.date) < -RECENT_OVERDUE_DAYS) staleOverdue.push(rest)
    else overdue.push(rest)
  }
  overdue.sort((a, b) => b.date.getTime() - a.date.getTime())
  staleOverdue.sort((a, b) => b.date.getTime() - a.date.getTime())
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
  pastDone.sort((a, b) => b.date.getTime() - a.date.getTime())
  return { overdue, staleOverdue, upcoming, pastDone }
}

export function summarizeGroups(groups: DayGroup[]) {
  const { overdue, staleOverdue, upcoming, pastDone } = partitionGroups(groups)
  const staleCount = staleOverdue.reduce(
    (count, group) => count + group.assignments.filter((a) => !a.done).length,
    0
  )
  const pastDoneCount = pastDone.reduce(
    (count, group) => count + group.assignments.length,
    0
  )
  return {
    ordered: [...overdue, ...upcoming],
    overdueCount: overdue.length,
    staleOverdue,
    staleLabel:
      staleCount > 1
        ? `Devoirs plus anciens (${staleCount})`
        : "Devoir plus ancien (1)",
    pastDone,
    pastDoneLabel:
      pastDoneCount > 1
        ? `Devoirs terminés (${pastDoneCount})`
        : "Devoir terminé (1)",
    nothingToDo:
      overdue.length + upcoming.length === 0 && staleOverdue.length === 0,
  }
}

export function dayLabel(date: Date, now = new Date()): string {
  const delta = daysUntil(date, now)
  if (delta === 0) return "Aujourd'hui"
  if (delta === 1) return "Demain"
  if (delta === -1) return "Hier"
  return fullDateLabel(date)
}

export function formatGivenOn(date: Date): string {
  return `Donné le ${date.toLocaleDateString("fr", {
    day: "numeric",
    month: "long",
  })}`
}
