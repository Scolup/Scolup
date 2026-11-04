import { daysUntil, fullDateLabel } from "@/lib/dates"

export function dayLabel(date: Date, now = new Date()): string {
  const delta = daysUntil(date, now)
  if (delta === 0) return "Aujourd'hui"
  if (delta === 1) return "Demain"
  if (delta === -1) return "Hier"
  return fullDateLabel(date)
}

export function formatGivenOn(date: Date): string {
  return `Donné le ${date.toLocaleDateString("fr", {
    day: "numeric",
    month: "long",
  })}`
}
