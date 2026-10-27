import { reloadRubies, RUBIES_KEY } from "./rubies"
import { getDB } from "./storage"
import { triggerHapticLight } from "./haptics"
import {
  activeQuests,
  applyEvent,
  parseProgress,
  periodKey,
  QUESTS,
  type ProgressMap,
  type QuestEvent,
  type QuestToast,
} from "./quest-rules"
import { addToWeek, parseWeeks, WEEKS_KEY } from "./shop-rules"

const PROGRESS_KEY = "progress"
const LEGACY_REWARDED_KEY = "rewarded" // old format, only read for migration

const toastListeners = new Set<(toast: QuestToast) => void>()
const changeListeners = new Set<() => void>()

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

export async function loadQuestProgress(): Promise<ProgressMap> {
  try {
    const db = await getDB()
    const [progressRaw, legacyRaw] = await Promise.all([
      db.get("quests", PROGRESS_KEY),
      db.get("quests", LEGACY_REWARDED_KEY),
    ])
    return parseProgress(progressRaw, legacyRaw)
  } catch {
    return {}
  }
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

// The only function the rest of the app needs: tell Scolup something happened.
//   void track("message-read")
//   void track("homework-done", String(homework.id))   // key = "this thing"
// Progress, rubies and the weekly recap are written in ONE IndexedDB
// transaction: either everything is saved or nothing, and two tabs can never
// both pay the same quest.
export async function track(event: QuestEvent, key?: string): Promise<void> {
  try {
    const now = new Date()
    const db = await getDB()
    const tx = db.transaction(["quests", "shop"], "readwrite")
    const quests = tx.objectStore("quests")
    const shop = tx.objectStore("shop")

    const [progressRaw, legacyRaw] = await Promise.all([
      quests.get(PROGRESS_KEY),
      quests.get(LEGACY_REWARDED_KEY),
    ])
    const { progress, completed } = applyEvent(
      activeQuests(QUESTS, now),
      parseProgress(progressRaw, legacyRaw),
      event,
      now,
      key
    )
    await quests.put(JSON.stringify(progress), PROGRESS_KEY)

    const reward = completed.reduce((sum, quest) => sum + quest.reward, 0)
    if (reward > 0) {
      const [balanceRaw, weeksRaw] = await Promise.all([
        shop.get(RUBIES_KEY),
        shop.get(WEEKS_KEY),
      ])
      const balance = toNumber(balanceRaw)
      const weeks = addToWeek(
        parseWeeks(weeksRaw),
        periodKey("weekly", now),
        reward
      )
      await shop.put(balance + reward, RUBIES_KEY)
      await shop.put(JSON.stringify(weeks), WEEKS_KEY)
    }
    await tx.done

    if (reward > 0) {
      await reloadRubies()
      triggerHapticLight()
      const loud = completed.filter((quest) => !quest.silent)
      if (loud.length > 0) {
        for (const l of toastListeners) l({ quests: loud })
      }
    }
    for (const l of changeListeners) l()
  } catch {
    // ponytail: a failed quest must never break the app. Ceiling: a failure is
    // silent, so the event is lost. Upgrade path: retry queue.
  }
}
