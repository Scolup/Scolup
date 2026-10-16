import { useSyncExternalStore } from "react"
import { getDB, type SubjectRecord } from "@/services/storage"

const SUBJECT_COLORS = [
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#EAB308",
  "#65A30D",
  "#16A34A",
  "#059669",
  "#0D9488",
  "#0891B2",
  "#0284C7",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#E11D48",
  "#92400E",
  "#475569",
]

export function seedColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

export const SUBJECT_PICKER_COLORS = [...SUBJECT_COLORS]

function isSubjectColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
}

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

let cache: SubjectRecord[] | null = readLocalMirror()
let hydrating = false
let hydrated = false
const listeners = new Set<() => void>()

function readLocalMirror(): SubjectRecord[] | null {
  try {
    const raw = localStorage.getItem("scolup:subjects")
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const list = parsed.filter(
      (entry): entry is SubjectRecord =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as SubjectRecord).id === "string" &&
        typeof (entry as SubjectRecord).name === "string"
    )
    return list
  } catch {
    return null
  }
}

function writeLocalMirror(list: SubjectRecord[]): void {
  try {
    localStorage.setItem("scolup:subjects", JSON.stringify(list))
  } catch {}
}

function emit(): void {
  for (const listener of listeners) listener()
}

async function hydrate(): Promise<void> {
  if (hydrating || hydrated) return
  hydrating = true
  try {
    const db = await getDB()
    const stored = await db.getAll("subjects")
    if (stored.length > 0 || cache === null) {
      cache = stored
      writeLocalMirror(stored)
      emit()
    }
    hydrated = true
  } catch {
  } finally {
    hydrating = false
  }
}

void hydrate()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hydrate()
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): SubjectRecord[] | null {
  return cache
}

export function useSubjects(): SubjectRecord[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function findSubject(
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

export function resolveSubjectColor(code?: string, name?: string): string {
  const list = cache ?? []
  const found = findSubject(list, code, name)
  if (found) {
    if (found.customColor && isSubjectColor(found.customColor))
      return found.customColor
    return seedColor(found.name)
  }
  return seedColor(name?.trim() || code?.trim() || "?")
}

export function resolveSubjectName(code?: string, name?: string): string {
  const list = cache ?? []
  const found = findSubject(list, code, name)
  if (found?.customName?.trim()) return found.customName.trim()
  if (name?.trim()) return name.trim()
  if (found) return found.name
  return code?.trim() || "Sans matière"
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

export function resolveSubjectCoef(code?: string, name?: string): number {
  const found = findSubject(cache ?? [], code, name)
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

async function persist(list: SubjectRecord[]): Promise<void> {
  cache = list
  writeLocalMirror(list)
  emit()
  try {
    const db = await getDB()
    const tx = db.transaction("subjects", "readwrite")
    await Promise.all(list.map((entry) => tx.store.put(entry, entry.id)))
    await tx.done
  } catch {}
}

export async function ensureSubjects(
  inputs: SubjectInput[]
): Promise<SubjectRecord[]> {
  await hydrate()
  hydrated = true
  const list = [...(cache ?? [])]
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

export interface SubjectCustomization {
  customName?: string
  customColor?: string
  coef?: number
}

export async function updateSubject(
  id: string,
  patch: SubjectCustomization
): Promise<SubjectRecord[]> {
  await hydrate()
  hydrated = true
  const list = [...(cache ?? [])]
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
  await hydrate()
  hydrated = true
  const list = [...(cache ?? [])]
  const index = list.findIndex((entry) => entry.id === id)
  if (index === -1) return list
  const { customName: _n, customColor: _c, coef: _k, ...rest } = list[index]
  list[index] = rest
  await persist(list)
  return list
}

interface DisciplineRow {
  discipline?: string
  codeMatiere?: string
  groupeMatiere?: boolean
  professeurs?: { nom?: string }[]
}

export interface DisciplineSubject extends SubjectInput {
  teacher?: string
}

export function disciplineSubjects(payload: unknown): DisciplineSubject[] {
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
