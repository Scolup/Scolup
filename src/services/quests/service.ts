import { reloadRubies, RUBIES_KEY } from "../rubies"
import { getDB, getSetting } from "../storage"
import { triggerHapticLight } from "../haptics"
import {
  activeQuests,
  applyEvent,
  parseProgress,
  periodKey,
  QUESTS,
} from "./index"
import type { QuestEvent, QuestPayload, QuestToast, ProgressMap } from "./types"
import {
  completeStreak,
  doneOutsideScolup,
  gradePayload,
  mergeLedger,
  newGrades,
  previousWeekKey,
  toGradeLite,
  weekComplete,
  type Ledger,
} from "../school-rules"
import { addToWeek, parseWeeks, WEEKS_KEY } from "../shop-rules"
import { resolveSubjectCoef } from "../subjects"
import { gradeKeepsStreak, isAverageMethod } from "@/pages/grades/helpers"
import {
  PROGRESS_KEY,
  LEGACY_REWARDED_KEY,
  LEGACY_CONTRACT_KEYS,
  LEDGER_KEY,
  SEEN_GRADES_KEY,
  GRADE_STREAK_ID,
  HIDE_GRADE_QUESTS,
} from "./constants"

const toastListeners = new Set<(toast: QuestToast) => void>()
const changeListeners = new Set<() => void>()

// Events triggered by ticking a homework. Rewarded only when Scolup saw it
// checked: a homework done outside Scolup pays nothing (see mergeLedger).
const HOMEWORK_EVENTS = new Set<QuestEvent>([
  "homework-done",
  "homework-ontime",
  "homework-late",
  "homework-early",
  "test-prepared",
])

export function subscribeQuestToast(
  fn: (toast: QuestToast) => void
): () => void {
  toastListeners.add(fn)
  return () => toastListeners.delete(fn)
}

export function subscribeQuests(fn: () => void): () => void {
  changeListeners.add(fn)
  return () => changeListeners.delete(fn)
}

// Call after a setting that changes which quests are shown.
export function refreshQuests(): void {
  for (const l of changeListeners) l()
}

function readJson<T>(raw: unknown, fallback: T): T {
  try {
    if (typeof raw !== "string") return fallback
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

async function hideGrades(): Promise<boolean> {
  return (await getSetting(HIDE_GRADE_QUESTS)) === true
}

// Everything the quest screens need.
export async function loadQuestState(): Promise<{
  progress: ProgressMap
  hideGrades: boolean
}> {
  try {
    const db = await getDB()
    const [progressRaw, legacyRaw] = await Promise.all([
      db.get("quests", PROGRESS_KEY),
      db.get("quests", LEGACY_REWARDED_KEY),
    ])
    return {
      progress: parseProgress(progressRaw, legacyRaw),
      hideGrades: await hideGrades(),
    }
  } catch {
    return { progress: {}, hideGrades: false }
  }
}

// The function the rest of the app uses: tell Scolup something happened.
export async function track(
  event: QuestEvent,
  key?: string,
  payload?: QuestPayload
): Promise<void> {
  try {
    const now = new Date()
    const hide = await hideGrades()
    const db = await getDB()
    if (key !== undefined && HOMEWORK_EVENTS.has(event)) {
      const ledger = readJson<Ledger>(await db.get("quests", LEDGER_KEY), {})
      if (doneOutsideScolup(ledger, key)) return
    }
    const tx = db.transaction(["quests", "shop"], "readwrite")
    const quests = tx.objectStore("quests")
    const shop = tx.objectStore("shop")

    const [progressRaw, legacyRaw] = await Promise.all([
      quests.get(PROGRESS_KEY),
      quests.get(LEGACY_REWARDED_KEY),
    ])
    const { progress, completed } = applyEvent(
      activeQuests(QUESTS, hide),
      parseProgress(progressRaw, legacyRaw),
      event,
      now,
      key,
      payload
    )
    await quests.put(JSON.stringify(progress), PROGRESS_KEY)

    const reward = completed.reduce((sum, quest) => sum + quest.reward, 0)
    if (reward > 0) {
      const [balanceRaw, weeksRaw] = await Promise.all([
        shop.get(RUBIES_KEY),
        shop.get(WEEKS_KEY),
      ])
      const weeks = addToWeek(
        parseWeeks(weeksRaw),
        periodKey("weekly", now),
        reward
      )
      await shop.put(toNumber(balanceRaw) + reward, RUBIES_KEY)
      await shop.put(JSON.stringify(weeks), WEEKS_KEY)
    }
    await tx.done

    if (reward > 0) {
      await reloadRubies()
      triggerHapticLight()
      for (const l of toastListeners) l({ quests: completed })
    }
    refreshQuests()
  } catch {
    // ponytail: a failed quest must never break the app.
  }
}

// ponytail: deletes the removed contract's data, once per session.
let contractDropped = false

export async function syncHomework(
  items: any[],
  fromScolup = false
): Promise<void> {
  try {
    const now = new Date()
    const db = await getDB()
    const tx = db.transaction("quests", "readwrite")
    const store = tx.objectStore("quests")
    const ledger = mergeLedger(
      readJson<any>(await store.get(LEDGER_KEY), {}),
      items,
      now,
      fromScolup
    )
    await store.put(JSON.stringify(ledger), LEDGER_KEY)
    if (!contractDropped) {
      contractDropped = true
      for (const legacyKey of LEGACY_CONTRACT_KEYS)
        await store.delete(legacyKey)
    }
    await tx.done

    const last = previousWeekKey(now)
    if (weekComplete(ledger, last)) {
      await track("week-complete", last)
      await track("week-streak", last, { streak: completeStreak(ledger, last) })
    }
  } catch {
    // ponytail: same as track().
  }
}

export async function syncGrades(grades: any[]): Promise<void> {
  try {
    const lites = grades.map(toGradeLite)
    // Read before the transaction opens: it must not wait on another store.
    const storedMethod = await getSetting("gradesAverageMethod")
    const method = isAverageMethod(storedMethod) ? storedMethod : "subject"
    const db = await getDB()
    const tx = db.transaction("quests", "readwrite")
    const store = tx.objectStore("quests")
    const seenParsed = readJson<unknown>(await store.get(SEEN_GRADES_KEY), null)
    const seen = Array.isArray(seenParsed) ? (seenParsed as string[]) : null
    const result = newGrades(lites, seen)
    await store.put(JSON.stringify(result.seen), SEEN_GRADES_KEY)

    // Grade streak: each new grade is judged once, in order, then the counter
    // is kept (never recomputed from the list). A grade that says nothing
    // (absent, first of its period) neither counts nor breaks.
    const [progressRaw, legacyRaw] = await Promise.all([
      store.get(PROGRESS_KEY),
      store.get(LEGACY_REWARDED_KEY),
    ])
    const progress = parseProgress(progressRaw, legacyRaw)
    const before = progress[GRADE_STREAK_ID]?.count ?? 0
    let streak = before
    const kept = new Map<string, number>() // grade key -> streak after it
    for (const grade of result.fresh) {
      const full = grades.find((candidate) => candidate.key === grade.key)
      if (!full) continue
      const keeps = gradeKeepsStreak(full, grades, resolveSubjectCoef, method)
      if (keeps === null) continue
      streak = keeps ? streak + 1 : 0
      if (keeps) kept.set(grade.key, streak)
    }
    if (streak !== before) {
      progress[GRADE_STREAK_ID] = { count: streak, period: "once", done: false }
      await store.put(JSON.stringify(progress), PROGRESS_KEY)
    }
    await tx.done

    for (const grade of result.fresh) {
      const payload = gradePayload(grade, lites)
      if (payload) await track("grade-received", grade.key, payload)
      const streakNow = kept.get(grade.key)
      if (streakNow) {
        await track("grade-streak", grade.key, { streak: streakNow })
      }
    }
  } catch {
    // ponytail: same as track().
  }
}
