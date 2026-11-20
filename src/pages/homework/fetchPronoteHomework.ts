import { addDays, toDayKey } from "@/lib/dates"
import { withPronote } from "@/services/litenote"
import type { Assignment } from "./types"

export async function fetchPronoteHomework(): Promise<Assignment[]> {
  const today = new Date()
  const assignments = await withPronote((client) =>
    client.homework(addDays(today, -7), addDays(today, 21))
  )
  return assignments.map((assignment, index) => ({
    key: "pronote:" + assignment.id,
    id: index + 1,
    pronoteId: assignment.id,
    due: assignment.deadline,
    dueKey: toDayKey(assignment.deadline),
    subject: assignment.subject.name,
    subjectCode: "pn:" + assignment.subject.id,
    content: assignment.description ?? "",
    done: assignment.done,
    isTest: false,
    onlineSubmission: assignment.return.canUpload,
    documents: assignment.attachments.map((file, i) => ({
      id: i + 1,
      name: file.name,
      type: "pronote",
      url: file.url,
    })),
    comments: [],
  }))
}
