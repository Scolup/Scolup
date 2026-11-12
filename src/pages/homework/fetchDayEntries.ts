import { ld } from "@/services/litedirecte"

export async function fetchDayEntries(
  day: string
): Promise<Record<string, unknown>[]> {
  const raw: unknown = await ld.homework.getHomeworkForDate(day)
  const wrapped = raw as { matieres?: unknown; subjects?: unknown } | null
  const entries = Array.isArray(raw)
    ? raw
    : Array.isArray(wrapped?.matieres)
      ? wrapped.matieres
      : wrapped?.subjects
  if (!Array.isArray(entries)) return []
  return entries.filter(
    (entry): entry is Record<string, unknown> =>
      !!entry && typeof entry === "object"
  )
}
