import { type SubjectRecord } from "@/services/storage"
import { isSubjectColor } from "./colors"
import { subjectId, type SubjectInput, defaultSubjectCoef } from "./names"
import { loadSubjects, persist } from "./store"

export async function ensureSubjects(
  inputs: SubjectInput[]
): Promise<SubjectRecord[]> {
  const list = await loadSubjects()
  const byId = new Map(list.map((entry) => [entry.id, entry]))
  let changed = false
  for (const input of inputs) {
    const name = input.name.trim()
    if (!name) continue
    const code = input.code?.trim() || undefined
    const id = subjectId(code, name)
    if (byId.has(id)) continue
    const entry: SubjectRecord = { id, code, name }
    byId.set(id, entry)
    list.push(entry)
    changed = true
  }
  if (changed) await persist(list)
  return list
}

interface SubjectCustomization {
  customName?: string
  customColor?: string
  coef?: number
}

export async function updateSubject(
  id: string,
  patch: SubjectCustomization
): Promise<SubjectRecord[]> {
  const list = await loadSubjects()
  const index = list.findIndex((entry) => entry.id === id)
  if (index === -1) return list
  const current = list[index]
  const customName =
    patch.customName !== undefined
      ? patch.customName.trim().slice(0, 60) || undefined
      : current.customName
  const customColor =
    patch.customColor !== undefined
      ? isSubjectColor(patch.customColor)
        ? patch.customColor
        : current.customColor
      : current.customColor
  const coef =
    patch.coef !== undefined
      ? Number.isFinite(patch.coef) && patch.coef > 0
        ? patch.coef
        : current.coef
      : current.coef
  const next: SubjectRecord = { ...current }
  if (customName) next.customName = customName
  else delete next.customName
  if (customColor) next.customColor = customColor
  else delete next.customColor
  // On ne stocke que ce qui diffère de la valeur par défaut : « 1 » est un
  // vrai choix (ex. Maths ramenées à 1) et ne doit pas être écrasé.
  const fallback = defaultSubjectCoef(current.name)
  if (coef !== undefined && coef !== fallback) next.coef = coef
  else delete next.coef
  list[index] = next
  await persist(list)
  return list
}

export async function resetSubject(id: string): Promise<SubjectRecord[]> {
  const list = await loadSubjects()
  const index = list.findIndex((entry) => entry.id === id)
  if (index === -1) return list
  const { customName: _n, customColor: _c, coef: _k, ...rest } = list[index]
  list[index] = rest
  await persist(list)
  return list
}
