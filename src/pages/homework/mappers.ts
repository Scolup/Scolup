import { parseDateKey } from "@/lib/dates"
import { decodeHtmlEntities, htmlToText } from "@/lib/html"
import type {
  RawComment,
  RawAssignment,
  RawSubjectEntry,
  HomeworkDocument,
  HomeworkComment,
  Assignment,
} from "./types"

function isDone(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") return value === "1" || value === "true"
  return false
}

export function toDocuments(files: unknown): HomeworkDocument[] {
  if (!Array.isArray(files)) return []
  return (files as Array<Record<string, unknown>>)
    .map((file): HomeworkDocument | null => {
      if (typeof file?.libelle !== "string" || !file.libelle) return null
      const id = Number(file.id)
      return {
        id: Number.isFinite(id) ? id : 0,
        name: file.libelle,
        type: typeof file.type === "string" ? file.type : "FICHIER_CDT",
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
          ? htmlToText(comment.message)
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
