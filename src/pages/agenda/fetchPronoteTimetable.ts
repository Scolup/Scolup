import { withPronote } from "@/services/litenote"
import { addDays, parseDateKey } from "@/lib/dates"
import type { Course } from "./types"

export async function fetchPronoteTimetable(
  start: string,
  end: string
): Promise<Course[]> {
  const from = parseDateKey(start),
    to = parseDateKey(end)
  if (!from || !to) return []
  const courses = await withPronote((client) =>
    client.timetable(from, addDays(to, 1))
  )
  return courses.map((course, index) => {
    const lesson = course.is === "lesson" ? course : undefined
    const stableId = "pronote:" + course.id
    return {
      key: stableId + ":" + course.startDate.getTime(),
      stableId,
      id: index + 1,
      title:
        lesson?.subject?.name ??
        (course.is === "lesson" ? "Cours" : course.title) ??
        "Retenue",
      subjectCode: lesson?.subject?.id ? "pn:" + lesson.subject.id : undefined,
      kind: "course",
      status: lesson?.test ? "evaluated" : undefined,
      details: lesson?.status,
      start: course.startDate,
      end: course.endDate,
      color: course.backgroundColor,
      teacher: lesson?.teacherNames.join(", "),
      room: lesson?.classrooms.join(", "),
      group: lesson?.groupNames.join(", "),
      cancelled: lesson?.canceled ?? false,
      modified: false,
      hasHomework: false,
      hasLessonContent: !!lesson?.lessonResourceID,
      pronoteResourceId: lesson?.lessonResourceID,
    }
  })
}
