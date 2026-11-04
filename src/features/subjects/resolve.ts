import { seedColor, isSubjectColor } from "./colors"
import { findSubject, defaultSubjectCoef } from "./names"
import { useSubjects, currentSubjects } from "./store"

export function resolveSubjectColor(code?: string, name?: string): string {
  const list = currentSubjects()
  const found = findSubject(list, code, name)
  if (found) {
    if (found.customColor && isSubjectColor(found.customColor))
      return found.customColor
    return seedColor(found.name)
  }
  return seedColor(name?.trim() || code?.trim() || "?")
}

export function resolveSubjectName(code?: string, name?: string): string {
  const list = currentSubjects()
  const found = findSubject(list, code, name)
  if (found?.customName?.trim()) return found.customName.trim()
  if (name?.trim()) return name.trim()
  if (found) return found.name
  return code?.trim() || "Sans matière"
}

export function resolveSubjectCoef(code?: string, name?: string): number {
  const found = findSubject(currentSubjects(), code, name)
  const coef = found?.coef
  if (typeof coef === "number" && Number.isFinite(coef) && coef > 0) return coef
  return defaultSubjectCoef(found?.name ?? name ?? "")
}

export function useSubjectDisplay(
  code?: string,
  name?: string
): { display: string; color: string } {
  useSubjects()
  return {
    display: resolveSubjectName(code, name),
    color: resolveSubjectColor(code, name),
  }
}
