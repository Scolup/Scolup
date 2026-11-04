import type { HomeworkComment, Assignment } from "./types"

export function appendComment(
  assignments: Assignment[],
  key: string,
  comment: HomeworkComment
): Assignment[] {
  return assignments.map((item) =>
    item.key === key ? { ...item, comments: [...item.comments, comment] } : item
  )
}

export function mergeDayDetails(
  prev: Assignment[],
  dueKey: string,
  parsed: Assignment[]
): Assignment[] {
  const byId = new Map(parsed.map((a) => [a.id, a]))
  return prev.map((item) => {
    if (item.dueKey !== dueKey) return item
    const full = byId.get(item.id)
    if (!full || full.content === undefined) return item
    return {
      ...item,
      content: full.content,
      documents: full.documents,
      comments: full.comments,
      givenOn: full.givenOn ?? item.givenOn,
      teacher: item.teacher ?? full.teacher,
    }
  })
}

export function preserveEnrichedDetails(
  prev: Assignment[],
  fresh: Assignment[]
): Assignment[] {
  if (prev.length === 0) return fresh
  const prevByKey = new Map(prev.map((a) => [a.key, a]))
  return fresh.map((item) => {
    const old = prevByKey.get(item.key)
    if (!old || old.content === undefined || item.content !== undefined)
      return item
    const localOnly = old.comments.filter(
      (c) => !item.comments.some((freshC) => freshC.id === c.id)
    )
    return {
      ...item,
      content: old.content,
      documents: item.documents.length === 0 ? old.documents : item.documents,
      comments: [...item.comments, ...localOnly],
      givenOn: item.givenOn ?? old.givenOn,
      teacher: item.teacher ?? old.teacher,
    }
  })
}
