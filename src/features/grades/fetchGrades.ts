import { ld } from "@/services/litedirecte"
import { getSetting } from "@/services/storage"
import { toEvalColors, toGrade } from "./mappers"
import { resolvePeriod, toPeriod } from "./periods"
import type { Grade, Period } from "./types"

interface GradesData {
  grades: Grade[]
  periods: Period[]
  evalColors: string[]
  // La période à afficher : celle choisie la dernière fois, sinon la première.
  defaultPeriod: Period | null
}

// Charge les notes depuis EcoleDirecte et les convertit en modèle Scolup.
// Utilisé par la page Notes et par le widget de l'accueil.
export async function fetchGrades(): Promise<GradesData> {
  if (!(await ld.auth.loadSession())) {
    throw new Error("Aucune session active. Reconnecte-toi.")
  }
  const result = (await ld.grades.getGrades()) as {
    notes?: unknown
    periodes?: unknown
    parametrage?: unknown
  }

  const rawGrades = Array.isArray(result.notes) ? result.notes : []
  const grades = (rawGrades as Record<string, unknown>[]).map(toGrade)

  const rawPeriods = Array.isArray(result.periodes) ? result.periodes : []
  const periods = (rawPeriods as Record<string, unknown>[])
    .map(toPeriod)
    .filter((period): period is Period => period !== null)

  const storedPeriod = await getSetting("gradesPeriod")
  const defaultPeriod =
    resolvePeriod(
      periods,
      typeof storedPeriod === "string" ? storedPeriod : undefined
    ) ?? null

  return {
    grades,
    periods,
    evalColors: toEvalColors(result.parametrage),
    defaultPeriod,
  }
}
