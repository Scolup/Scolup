import type { QuestDef, QuestPeriod, QuestState } from "../types"

interface Trackable extends QuestDef {
  period: QuestPeriod
  state: QuestState
  count: number
  goal: number
}

// Tiers of one goal (25 / 100 / 250 homework...) share a track: only the
// closest tier of each track is worth showing.
function trackOf(quest: Trackable): string {
  if (quest.gauge) return quest.gauge
  return `${quest.event}:${quest.period}:${JSON.stringify(quest.match ?? {})}`
}

// The quests the student is closest to finishing, all kinds mixed: 24/25 beats
// 1/2, which beats 0/3. On equal progress a weekly quest comes first (it runs
// out on Sunday), then the catalog order decides. Done quests and secret ones
// are skipped: a secret must stay a surprise.
export function nextQuests<T extends Trackable>(quests: T[], max = 3): T[] {
  const byUrgency = (quest: T) => Number(quest.period !== "once")
  const sorted = quests
    .filter((quest) => quest.state === "unachieved")
    .sort(
      (a, b) =>
        b.count / b.goal - a.count / a.goal || byUrgency(b) - byUrgency(a)
    )
  const tracks = new Set<string>()
  return sorted
    .filter((quest) => {
      const track = trackOf(quest)
      if (tracks.has(track)) return false
      tracks.add(track)
      return true
    })
    .slice(0, max)
}
