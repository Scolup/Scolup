import { capitalize, dayName, daysUntil, hoursLabel } from "@/lib/dates"
import type { Course } from "./types"

export function dayLabel(date: Date, now = new Date()): string {
  const delta = daysUntil(date, now)
  if (delta === 0) return "Aujourd'hui"
  if (delta === 1) return "Demain"
  if (delta === -1) return "Hier"
  return capitalize(`${dayName(date)} ${date.getDate()}`)
}

export function durationLabel(course: Course): string {
  if (!course.start || !course.end) return ""
  const minutes = Math.round(
    (course.end.getTime() - course.start.getTime()) / 60_000
  )
  return minutes > 0 ? hoursLabel(minutes) : ""
}

export function countdownLabel(from: Date, to: Date): string {
  const minutes = Math.max(
    0,
    Math.round((to.getTime() - from.getTime()) / 60_000)
  )
  if (minutes < 1) return "maintenant"
  if (minutes < 60) return `dans ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24)
    return rest === 0
      ? `dans ${hours} h`
      : `dans ${hours} h ${String(rest).padStart(2, "0")}`
  const days = Math.floor(hours / 24)
  return days === 1 ? "demain" : `dans ${days} j`
}

export function courseRelativeLabel(
  course: Course,
  now = new Date()
): string | null {
  if (!course.start || !course.end) return null
  if (now.getTime() < course.start.getTime())
    return countdownLabel(now, course.start)
  if (now.getTime() < course.end.getTime()) {
    const left = Math.round((course.end.getTime() - now.getTime()) / 60_000)
    if (left <= 0) return "se termine"
    if (left < 60) return `se termine dans ${left} min`
    return "en ce moment"
  }
  return null
}
