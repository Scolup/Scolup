import { daysUntil } from "@/lib/dates"
import type { Assignment, DayGroup } from "./types"

export function groupByDay(assignments: Assignment[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()

  for (const assignment of assignments) {
    const group = groups.get(assignment.dueKey)
    if (group) group.assignments.push(assignment)
    else
      groups.set(assignment.dueKey, {
        key: assignment.dueKey,
        date: assignment.due,
        assignments: [assignment],
      })
  }

  return [...groups.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((group) => ({
      ...group,
      assignments: group.assignments.sort((a, b) =>
        a.subject.localeCompare(b.subject, "fr")
      ),
    }))
}

const RECENT_OVERDUE_DAYS = 7

function partitionGroups(groups: DayGroup[]): {
  overdue: DayGroup[]
  staleOverdue: DayGroup[]
  upcoming: DayGroup[]
  pastDone: DayGroup[]
} {
  const overdue: DayGroup[] = []
  const staleOverdue: DayGroup[] = []
  const upcoming: DayGroup[] = []
  const pastDone: DayGroup[] = []
  for (const group of groups) {
    if (daysUntil(group.date) >= 0) {
      upcoming.push(group)
      continue
    }
    const undone = group.assignments.filter((a) => !a.done)
    const done = group.assignments.filter((a) => a.done)
    if (done.length > 0) pastDone.push({ ...group, assignments: done })
    if (undone.length === 0) continue
    const rest = { ...group, assignments: undone }
    if (daysUntil(group.date) < -RECENT_OVERDUE_DAYS) staleOverdue.push(rest)
    else overdue.push(rest)
  }
  overdue.sort((a, b) => b.date.getTime() - a.date.getTime())
  staleOverdue.sort((a, b) => b.date.getTime() - a.date.getTime())
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
  pastDone.sort((a, b) => b.date.getTime() - a.date.getTime())
  return { overdue, staleOverdue, upcoming, pastDone }
}

export function summarizeGroups(groups: DayGroup[]) {
  const { overdue, staleOverdue, upcoming, pastDone } = partitionGroups(groups)
  const staleCount = staleOverdue.reduce(
    (count, group) => count + group.assignments.filter((a) => !a.done).length,
    0
  )
  const pastDoneCount = pastDone.reduce(
    (count, group) => count + group.assignments.length,
    0
  )
  return {
    ordered: [...overdue, ...upcoming],
    staleOverdue,
    staleLabel:
      staleCount > 1
        ? `Devoirs plus anciens (${staleCount})`
        : "Devoir plus ancien (1)",
    pastDone,
    pastDoneLabel:
      pastDoneCount > 1
        ? `Devoirs terminés (${pastDoneCount})`
        : "Devoir terminé (1)",
    nothingToDo:
      overdue.length + upcoming.length === 0 && staleOverdue.length === 0,
  }
}
