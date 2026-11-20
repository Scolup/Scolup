import { ld } from "@/services/litedirecte"
import { isPronote, withPronote } from "@/services/litenote"
import { addDays, weekOf } from "@/lib/dates"
import { subjectId, type SubjectInput } from "./names"

interface DisciplineRow {
  discipline?: string
  codeMatiere?: string
  groupeMatiere?: boolean
  professeurs?: { nom?: string }[]
}

export interface DisciplineSubject extends SubjectInput {
  teacher?: string
}

export async function fetchDisciplineSubjects(): Promise<DisciplineSubject[]> {
  if (isPronote()) return fetchPronoteSubjects()
  if (!(await ld.auth.loadSession())) {
    throw new Error("Aucune session active. Reconnecte-toi.")
  }
  return disciplineSubjects(await ld.grades.getGrades())
}

async function fetchPronoteSubjects(): Promise<DisciplineSubject[]> {
  const [monday] = weekOf(new Date())
  const [grades, timetable] = await Promise.allSettled([
    withPronote((client) => client.grades()),
    withPronote((client) => client.timetable(monday, addDays(monday, 7))),
  ])
  if (grades.status === "rejected" && timetable.status === "rejected")
    throw grades.reason

  const subjects = new Map<string, DisciplineSubject>()
  if (grades.status === "fulfilled") {
    for (const { overview } of grades.value.reports) {
      for (const { subject } of [
        ...overview.subjectsAverages,
        ...overview.grades,
      ]) {
        const code = `pn:${subject.id}`
        subjects.set(code, { code, name: subject.name })
      }
    }
  }
  if (timetable.status === "fulfilled") {
    for (const lesson of timetable.value) {
      if (lesson.is !== "lesson" || !lesson.subject) continue
      const code = `pn:${lesson.subject.id}`
      const teacher =
        subjects.get(code)?.teacher ||
        lesson.teacherNames.join(", ") ||
        undefined
      subjects.set(code, { code, name: lesson.subject.name, teacher })
    }
  }
  return [...subjects.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  )
}

function disciplineSubjects(payload: unknown): DisciplineSubject[] {
  const periodes = (payload as { periodes?: unknown } | null)?.periodes
  if (!Array.isArray(periodes)) return []
  const byId = new Map<string, DisciplineSubject>()
  for (const periode of periodes) {
    const ensemble = (periode as { ensembleMatieres?: unknown } | null)
      ?.ensembleMatieres as
      | { disciplines?: unknown; disciplinesSimulation?: unknown }
      | undefined
    const rows = [
      ...(Array.isArray(ensemble?.disciplines) ? ensemble.disciplines : []),
      ...(Array.isArray(ensemble?.disciplinesSimulation)
        ? ensemble.disciplinesSimulation
        : []),
    ]
    for (const row of rows as DisciplineRow[]) {
      if (!row || typeof row !== "object" || row.groupeMatiere === true)
        continue
      const code = row.codeMatiere?.trim() || undefined
      const name = row.discipline?.trim() || code || ""
      if (!name) continue
      const teacher = Array.isArray(row.professeurs)
        ? row.professeurs
            .find((prof) => typeof prof?.nom === "string" && prof.nom.trim())
            ?.nom?.trim()
        : undefined
      const id = subjectId(code, name)
      const existing = byId.get(id)
      if (existing) {
        if (!existing.teacher && teacher) existing.teacher = teacher
        continue
      }
      byId.set(id, { code, name, teacher })
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"))
}
