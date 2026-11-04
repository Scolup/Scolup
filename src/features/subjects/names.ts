import { type SubjectRecord } from "@/services/storage"

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export function subjectId(code?: string, name?: string): string {
  if (code?.trim()) return `c:${normalizeCode(code)}`
  return `n:${normalizeName(name ?? "?")}`
}

export interface SubjectInput {
  code?: string
  name: string
}

export function findSubject(
  list: SubjectRecord[],
  code?: string,
  name?: string
): SubjectRecord | undefined {
  if (code?.trim()) {
    const needle = normalizeCode(code)
    const byCode = list.find(
      (entry) => entry.code && normalizeCode(entry.code) === needle
    )
    if (byCode) return byCode
  }
  if (name?.trim()) {
    const needle = normalizeName(name)
    return list.find((entry) => normalizeName(entry.name) === needle)
  }
  return undefined
}

// Coefficient par défaut selon le nom officiel de la matière. On compare sur
// le préfixe pour encaisser les variantes (« Histoire/Géographie »,
// « Histoire-géographie », « Maths »…).
export function defaultSubjectCoef(name: string): number {
  const normalized = normalizeName(name)
  if (normalized.startsWith("math") || normalized.startsWith("fran")) return 3
  if (
    normalized.startsWith("anglais") ||
    normalized.startsWith("hist") ||
    normalized.startsWith("géo")
  )
    return 2
  return 1
}
