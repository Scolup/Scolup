// Pure quest logic: the catalog + the rules. No React, no IndexedDB, so it
// can be unit-tested (see tests/quests.test.ts).
//
// ADD A QUEST  -> add one object to QUESTS below. That's it.
// ADD AN EVENT -> add its name to QuestEvent, then call track("name") where
//                 it happens in the app.

export type QuestPeriod = "once" | "daily" | "weekly"

export type QuestEvent =
  | "app-open"
  | "homework-done"
  | "homework-early"
  | "setting-changed"
  | "agenda-viewed"
  | "message-read"
  | "average-up"

export interface QuestDef {
  id: string // never change an id once shipped: progress is stored by id
  title: string
  description: string
  reward: number
  event: QuestEvent // the event that makes this quest progress
  goal?: number // how many times (default 1)
  period?: QuestPeriod // when progress resets (default: the pool, else "once")
  pool?: "daily" | "weekly" // rotation: only a few of the pool are active
  perDay?: boolean // count at most 1 per day (e.g. "open the app 4 days")
  unique?: boolean // count each track(event, key) key once (e.g. a homework id)
  secret?: boolean // shown as "???" until achieved
  silent?: boolean // no toast when achieved
}

export const QUESTS: QuestDef[] = [
  // Achievements (one-shot)
  {
    id: "bienvenue",
    title: "Bienvenue",
    description: "Ouvrir Scolup",
    reward: 50,
    event: "app-open",
    silent: true,
  },
  {
    id: "un-bon-debut",
    title: "Un bon début",
    description: "Cocher un devoir",
    reward: 15,
    event: "homework-done",
  },
  {
    id: "tatillon",
    title: "Tâtillon",
    description: "Changer un paramètre",
    reward: 20,
    event: "setting-changed",
  },
  {
    // Was "10 weekdays in a row" (impossible: Friday -> Monday broke the
    // streak). Now 10 days in total: no streak to lose, no pressure.
    id: "habitue",
    title: "Habitué",
    description: "Ouvrir Scolup 10 jours",
    reward: 30,
    event: "app-open",
    goal: 10,
    perDay: true,
  },
  // Always-on weekly goal (resets every Monday)
  {
    id: "assidu",
    title: "Assidu",
    description: "Ouvrir Scolup 4 jours cette semaine",
    reward: 20,
    event: "app-open",
    goal: 4,
    period: "weekly",
    perDay: true,
  },
  // Daily pool: 2 of these 3 are active each day (small rewards on purpose)
  {
    id: "journee",
    title: "Journée préparée",
    description: "Consulter ton agenda",
    reward: 5,
    event: "agenda-viewed",
    pool: "daily",
  },
  {
    id: "courrier",
    title: "Courrier",
    description: "Lire un message",
    reward: 5,
    event: "message-read",
    pool: "daily",
  },
  {
    id: "devoir-du-jour",
    title: "Un de fait",
    description: "Cocher un devoir",
    reward: 5,
    event: "homework-done",
    unique: true,
    pool: "daily",
  },
  // Weekly pool: 2 of these 3 are active each week
  {
    id: "devoirs-semaine",
    title: "Au carré",
    description: "Cocher 5 devoirs cette semaine",
    reward: 25,
    event: "homework-done",
    goal: 5,
    unique: true,
    pool: "weekly",
  },
  {
    id: "prevoyant",
    title: "Prévoyant",
    description: "Cocher 2 devoirs avant le jour de rendu",
    reward: 25,
    event: "homework-early",
    goal: 2,
    unique: true,
    pool: "weekly",
  },
  {
    id: "en-progres",
    title: "En progrès",
    description: "Ta moyenne générale a progressé cette semaine",
    reward: 25,
    event: "average-up",
    pool: "weekly",
  },
]

export type QuestState = "secret" | "unachieved" | "achieved"

export interface QuestProgress {
  count: number
  period: string // key of the period this count belongs to
  lastDay?: string // last day counted (for perDay quests)
  seen?: string[] // keys already counted (for unique quests)
  done: boolean
}

export type ProgressMap = Record<string, QuestProgress>

export function questPeriod(quest: QuestDef): QuestPeriod {
  return quest.period ?? quest.pool ?? "once"
}

function dayKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

// A week is identified by its Monday, so Friday -> Monday is the same
// "school week" boundary for everyone, whatever the locale.
function weekKey(d: Date): string {
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(monday)
}

export function periodKey(period: QuestPeriod, now: Date): string {
  if (period === "daily") return dayKey(now)
  if (period === "weekly") return weekKey(now)
  return "once"
}

// Small deterministic hash: same day/week => same picks on every device.
function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  }
  return h
}

const POOL_SIZE = { daily: 2, weekly: 2 } as const

// Quests that can progress right now: every non-pool quest, plus a rotating
// selection of each pool. No server needed: the date is the seed.
export function activeQuests(quests: QuestDef[], now: Date): QuestDef[] {
  const picked = new Set<QuestDef>()
  for (const pool of ["daily", "weekly"] as const) {
    const key = periodKey(pool, now)
    quests
      .filter((quest) => quest.pool === pool)
      .map((quest) => ({ quest, score: hash(`${quest.id}:${key}`) }))
      .sort((a, b) => a.score - b.score || a.quest.id.localeCompare(b.quest.id))
      .slice(0, POOL_SIZE[pool])
      .forEach(({ quest }) => picked.add(quest))
  }
  return quests.filter((quest) => !quest.pool || picked.has(quest))
}

// Registers one event. Returns the new progress and the quests it completed.
// Never mutates its input. `key` identifies the thing (a homework id) for
// quests flagged `unique`, so ticking the same homework twice counts once.
export function applyEvent(
  quests: QuestDef[],
  progress: ProgressMap,
  event: QuestEvent,
  now: Date,
  key?: string
): { progress: ProgressMap; completed: QuestDef[] } {
  const next: ProgressMap = { ...progress }
  const completed: QuestDef[] = []
  const today = dayKey(now)

  for (const quest of quests) {
    if (quest.event !== event) continue

    const period = periodKey(questPeriod(quest), now)
    const saved = next[quest.id]
    // New period (new week, new day)? Start from zero.
    const current: QuestProgress =
      saved && saved.period === period
        ? saved
        : { count: 0, period, done: false }

    if (current.done) continue
    if (quest.perDay && current.lastDay === today) continue
    if (quest.unique && key !== undefined && current.seen?.includes(key)) {
      continue
    }

    const count = current.count + 1
    const done = count >= (quest.goal ?? 1)
    const updated: QuestProgress = { count, period, lastDay: today, done }
    if (quest.unique && key !== undefined) {
      updated.seen = [...(current.seen ?? []), key]
    }
    next[quest.id] = updated
    if (done) completed.push(quest)
  }

  return { progress: next, completed }
}

// What the UI shows for a quest (progress of a past period counts as 0).
export function questView(
  quest: QuestDef,
  progress: ProgressMap,
  now: Date
): { goal: number; count: number; state: QuestState } {
  const goal = quest.goal ?? 1
  const saved = progress[quest.id]
  const current =
    saved && saved.period === periodKey(questPeriod(quest), now) ? saved : null
  const state: QuestState = current?.done
    ? "achieved"
    : quest.secret
      ? "secret"
      : "unachieved"
  return { goal, count: Math.min(current?.count ?? 0, goal), state }
}

// Text of the "quest done" toast.
export interface QuestToast {
  quests: QuestDef[]
}

export function toastText({ quests }: QuestToast): string {
  const total = quests.reduce((sum, quest) => sum + quest.reward, 0)
  return quests.length === 1
    ? `Quête accomplie : ${quests[0].title} (+${total} rubis)`
    : `${quests.length} quêtes accomplies (+${total} rubis)`
}

// Old storage: a JSON array of rewarded quest ids. Those users must keep
// their quests and must NOT be paid twice.
export function migrateLegacy(ids: unknown[]): ProgressMap {
  const result: ProgressMap = {}
  for (const quest of QUESTS) {
    if (ids.includes(quest.id)) {
      result[quest.id] = {
        count: quest.goal ?? 1,
        period: periodKey(questPeriod(quest), new Date()),
        done: true,
      }
    }
  }
  return result
}

export function parseProgress(
  progressRaw: unknown,
  legacyRewardedRaw: unknown
): ProgressMap {
  try {
    if (typeof progressRaw === "string") {
      const parsed: unknown = JSON.parse(progressRaw)
      if (parsed && typeof parsed === "object") return parsed as ProgressMap
    }
    if (typeof legacyRewardedRaw === "string") {
      const ids: unknown = JSON.parse(legacyRewardedRaw)
      if (Array.isArray(ids)) return migrateLegacy(ids)
    }
  } catch {}
  return {}
}
