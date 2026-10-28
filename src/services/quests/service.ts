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
import type {
  QuestDef,
  QuestEvent,
  QuestPayload,
  QuestToast,
  ProgressMap,
} from "./types"
import {
  contractContext,
  contractHash,
  generateContract,
  gradePayload,
  mergeLedger,
  newGrades,
  previousWeekKey,
  toGradeLite,
  weakestSubject,
  weekComplete,
} from "../school-rules"
import { addToWeek, parseWeeks, WEEKS_KEY } from "../shop-rules"
import {
  PROGRESS_KEY,
  LEGACY_REWARDED_KEY,
  CONTRACT_KEY,
  LEDGER_KEY,
  SEEN_GRADES_KEY,
  WEAKEST_KEY,
  HIDE_GRADE_QUESTS,
} from "./constants"

export interface Contract {
  week: string
  hash: string
  announced: boolean
  quests: QuestDef[]
}

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

function readContract(raw: unknown): Contract {
  const contract = readJson<Partial<Contract>>(raw, {})
  return {
    week: contract.week ?? "",
    hash: contract.hash ?? "",
    announced: contract.announced === true,
    quests: Array.isArray(contract.quests) ? contract.quests : [],
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
  generated: QuestDef[]
  hideGrades: boolean
}> {
  try {
    const db = await getDB()
    const [progressRaw, legacyRaw, contractRaw] = await Promise.all([
      db.get("quests", PROGRESS_KEY),
      db.get("quests", LEGACY_REWARDED_KEY),
      db.get("quests", CONTRACT_KEY),
    ])
    return {
      progress: parseProgress(progressRaw, legacyRaw),
      generated: readContract(contractRaw).quests,
      hideGrades: await hideGrades(),
    }
  } catch {
    return { progress: {}, generated: [], hideGrades: false }
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
    const tx = db.transaction(["quests", "shop"], "readwrite")
    const quests = tx.objectStore("quests")
    const shop = tx.objectStore("shop")

    const [progressRaw, legacyRaw, contractRaw] = await Promise.all([
      quests.get(PROGRESS_KEY),
      quests.get(LEGACY_REWARDED_KEY),
      quests.get(CONTRACT_KEY),
    ])
    const { progress, completed } = applyEvent(
      activeQuests([...QUESTS, ...readContract(contractRaw).quests], now, hide),
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

// Builds (or rebuilds) this week's personalised contract.
async function refreshContract(): Promise<void> {
  try {
    const now = new Date()
    const hide = await hideGrades()
    const db = await getDB()
    const tx = db.transaction("quests", "readwrite")
    const store = tx.objectStore("quests")
    const [contractRaw, ledgerRaw, weakestRaw, progressRaw, legacyRaw] =
      await Promise.all([
        store.get(CONTRACT_KEY),
        store.get(LEDGER_KEY),
        store.get(WEAKEST_KEY),
        store.get(PROGRESS_KEY),
        store.get(LEGACY_REWARDED_KEY),
      ])
    const contract = readContract(contractRaw)
    const ctx = contractContext(
      readJson<any>(ledgerRaw, {}),
      readJson<any>(weakestRaw, null),
      hide,
      now
    )
    const hash = contractHash(ctx)
    const progress = parseProgress(progressRaw, legacyRaw)
    const sameWeek = contract.week === ctx.week
    const started = contract.quests.some(
      (quest) => (progress[quest.id]?.count ?? 0) > 0
    )

    let announce = false
    if (!sameWeek || (contract.hash !== hash && !started)) {
      const generated = generateContract(ctx)
      announce = !(sameWeek && contract.announced) && generated.length > 0
      const next: Contract = {
        week: ctx.week,
        hash,
        announced: announce || (sameWeek && contract.announced),
        quests: generated,
      }
      await store.put(JSON.stringify(next), CONTRACT_KEY)
      const ids = new Set(generated.map((quest) => quest.id))
      const kept = Object.fromEntries(
        Object.entries(progress).filter(
          ([id]) => !id.startsWith("contract:") || ids.has(id)
        )
      )
      await store.put(JSON.stringify(kept), PROGRESS_KEY)
    }
    await tx.done

    if (announce) {
      for (const l of toastListeners) {
        l({
          quests: [],
          text: "Nouveau contrat de la semaine : découvre tes quêtes !",
        })
      }
    }
    refreshQuests()
  } catch {
    // ponytail: same as track().
  }
}

export async function syncHomework(items: any[]): Promise<void> {
  try {
    const now = new Date()
    const db = await getDB()
    const tx = db.transaction("quests", "readwrite")
    const store = tx.objectStore("quests")
    const ledger = mergeLedger(
      readJson<any>(await store.get(LEDGER_KEY), {}),
      items,
      now
    )
    await store.put(JSON.stringify(ledger), LEDGER_KEY)
    await tx.done

    const last = previousWeekKey(now)
    if (weekComplete(ledger, last)) await track("week-complete", last)
    await refreshContract()
  } catch {
    // ponytail: same as track().
  }
}

export async function syncGrades(grades: any[]): Promise<void> {
  try {
    const lites = grades.map(toGradeLite)
    const db = await getDB()
    const tx = db.transaction("quests", "readwrite")
    const store = tx.objectStore("quests")
    const seenParsed = readJson<unknown>(await store.get(SEEN_GRADES_KEY), null)
    const seen = Array.isArray(seenParsed) ? (seenParsed as string[]) : null
    const result = newGrades(lites, seen)
    await store.put(JSON.stringify(result.seen), SEEN_GRADES_KEY)
    await store.put(JSON.stringify(weakestSubject(lites)), WEAKEST_KEY)
    await tx.done

    for (const grade of result.fresh) {
      const payload = gradePayload(grade, lites)
      if (payload) await track("grade-received", grade.key, payload)
    }
    await refreshContract()
  } catch {
    // ponytail: same as track().
  }
}
