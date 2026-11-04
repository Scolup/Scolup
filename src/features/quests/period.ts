import { toDayKey } from "@/lib/dates"
import type { QuestDef, QuestPeriod } from "./types"

export function questPeriod(quest: QuestDef): QuestPeriod {
  return quest.period ?? "once"
}

// A week is identified by its Monday, so Friday -> Monday is the same
// "school week" boundary for everyone, whatever the locale.
export function weekKey(d: Date): string {
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toDayKey(monday)
}

export function periodKey(period: QuestPeriod, now: Date): string {
  if (period === "daily") return toDayKey(now)
  if (period === "weekly") return weekKey(now)
  return "once"
}
