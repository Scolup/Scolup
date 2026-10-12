export function timetableCourses<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const wrapped = (payload as { timetable?: unknown } | null)?.timetable
  return Array.isArray(wrapped) ? (wrapped as T[]) : []
}
