import type { QuestPeriod } from "../types"

export function dayKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

// A week is identified by its Monday, so Friday -> Monday is the same
// "school week" boundary for everyone, whatever the locale.
export function weekKey(d: Date): string {
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(monday)
}

export function periodKey(period: QuestPeriod, now: Date): string {
  if (period === "daily") return dayKey(now)
  if (period === "weekly") return weekKey(now)
  return "once"
}
