import { ld } from "@/services/litedirecte"
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

// Les matières de l'élève d'après la page des notes d'EcoleDirecte.
export async function fetchDisciplineSubjects(): Promise<DisciplineSubject[]> {
  if (!(await ld.auth.loadSession())) {
    throw new Error("Aucune session active. Reconnecte-toi.")
  }
  return disciplineSubjects(await ld.grades.getGrades())
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
