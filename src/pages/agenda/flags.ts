import {
  Award01Icon,
  GhostIcon,
  LibraryIcon,
  Notebook01Icon,
  Video02Icon,
} from "@hugeicons/core-free-icons"
import type { Course, CourseFlag } from "./types"

export function courseFlags(course: Course): CourseFlag[] {
  const flags: CourseFlag[] = []
  if (course.cancelled) {
    flags.push({
      key: "cancelled",
      label: "Annulé",
      icon: GhostIcon,
      tone: "destructive",
    })
  } else {
    if (course.modified)
      flags.push({ key: "modified", label: "Modifié", tone: "warning" })
    if (course.status === "online")
      flags.push({
        key: "online",
        label: "Distanciel",
        icon: Video02Icon,
        tone: "secondary",
      })
    if (course.status === "evaluated")
      flags.push({
        key: "evaluated",
        label: "Évalué",
        icon: Award01Icon,
        tone: "warning",
      })
  }
  if (course.hasHomework)
    flags.push({
      key: "homework",
      label: "Devoir",
      icon: LibraryIcon,
      tone: "info",
    })
  if (course.hasLessonContent)
    flags.push({
      key: "session",
      label: "Séance",
      icon: Notebook01Icon,
      tone: "secondary",
    })
  return flags
}
