import type { Competency, Grade } from "./types"
import { parseGradeNumber } from "./grade"

export const DEFAULT_EVAL_COLORS = ["#ff0000", "#ffc000", "#1e8910", "#005bb0"]

export function toEvalColors(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return DEFAULT_EVAL_COLORS
  const record = raw as Record<string, unknown>
  const colors = [1, 2, 3, 4].map((level) => record[`couleurEval${level}`])
  return colors.every((color) => typeof color === "string" && color)
    ? (colors as string[])
    : DEFAULT_EVAL_COLORS
}

function toCompetencies(raw: unknown): Competency[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry, entryIndex) => {
    if (!entry || typeof entry !== "object") return []
    const record = entry as Record<string, unknown>
    const label =
      (record.libelleCompetence as string) ||
      (record.descriptif as string) ||
      "Compétence"
    const level = parseGradeNumber(record.valeur)
    return [
      {
        key: `${label}-${entryIndex}`,
        level:
          level !== null && Number.isInteger(level) && level >= 1 && level <= 4
            ? level
            : null,
        label,
      },
    ]
  })
}

export function toGrade(raw: Record<string, unknown>, index: number): Grade {
  const subject =
    (raw.libelleMatiere as string) ||
    (raw.codeMatiere as string) ||
    "Sans matière"
  return {
    key: String(
      (raw.id as number | string | undefined) ?? `${subject}-${index}`
    ),
    subject,
    subjectCode:
      typeof raw.codeMatiere === "string" && raw.codeMatiere.trim()
        ? raw.codeMatiere.trim()
        : undefined,
    title: (raw.devoir as string) || "Évaluation",
    typeDevoir:
      typeof raw.typeDevoir === "string" && raw.typeDevoir.trim()
        ? raw.typeDevoir.trim()
        : undefined,
    comment:
      typeof raw.commentaire === "string" && raw.commentaire.trim()
        ? raw.commentaire.trim()
        : undefined,
    date: raw.date instanceof Date ? raw.date : undefined,
    enteredOn: raw.dateSaisie instanceof Date ? raw.dateSaisie : undefined,
    value:
      typeof raw.valeur === "string"
        ? raw.valeur
        : typeof raw.valeur === "number"
          ? String(raw.valeur)
          : "",
    outOf:
      typeof raw.noteSur === "string"
        ? raw.noteSur
        : typeof raw.noteSur === "number"
          ? String(raw.noteSur)
          : "20",
    coef: String(raw.coef ?? "1"),
    period: typeof raw.codePeriode === "string" ? raw.codePeriode : "",
    competencies: toCompetencies(raw.elementsProgramme),
    nonSignificant: raw.nonSignificatif === true || raw.nonSignificatif === "1",
  }
}
