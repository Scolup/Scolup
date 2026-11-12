// Lecture et fusion de l'état local synchronisable, dans UNE transaction
// IndexedDB : lire, fusionner et écrire sans qu'une action de l'utilisateur
// (achat, quête...) puisse s'intercaler et être écrasée.

import { parseProgress } from "@/features/quests/migration"
import {
  LEDGER_KEY,
  LEGACY_REWARDED_KEY,
  PROGRESS_KEY,
  SEEN_GRADES_KEY,
} from "@/features/quests/constants"
import type { Ledger } from "@/features/quests/schoolEvents"
import { readWallet, writeWallet } from "@/features/shop/walletStore"
import { mergeStates, type SyncState } from "@/features/sync/document"
import { isSyncedSetting } from "@/features/sync/keys"
import { canonical, type SyncedSetting } from "@/features/sync/merge"
import { getDB, type SubjectRecord } from "./storage"
import {
  exchangedRubies,
  parseLearn,
  withGemExchange,
} from "@/features/learn/progress"

export interface Applied {
  settings: string[] // réglages modifiés
  subjects: boolean
  wallet: boolean
  quests: boolean
  learn: boolean
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

// Fusionne les états distants dans la base locale et renvoie l'état obtenu.
// Sans état distant, c'est une simple lecture.
export async function mergeIntoLocal(
  remotes: SyncState[],
  accountId: string
): Promise<{ state: SyncState; applied: Applied }> {
  console.debug("[sync] mergeIntoLocal: remotes =", remotes.length)
  const db = await getDB()
  const tx = db.transaction(
    ["settings", "meta", "subjects", "shop", "quests", "learn"],
    "readwrite"
  )
  const settingsStore = tx.objectStore("settings")
  const metaStore = tx.objectStore("meta")
  const subjectsStore = tx.objectStore("subjects")
  const shopStore = tx.objectStore("shop")
  const questsStore = tx.objectStore("quests")
  const learnStore = tx.objectStore("learn")

  // ---- Lecture
  const settings: Record<string, SyncedSetting> = {}
  const settingKeys = (await settingsStore.getAllKeys()).filter(
    (key): key is string => typeof key === "string" && isSyncedSetting(key)
  )
  await Promise.all(
    settingKeys.map(async (key) => {
      const [v, t] = await Promise.all([
        settingsStore.get(key),
        metaStore.get(`s:${key}`),
      ])
      if (typeof v === "string" || typeof v === "boolean") {
        settings[key] = { v, t: t ?? 0 }
      }
    })
  )
  const subjects: Record<string, SubjectRecord> = {}
  for (const entry of await subjectsStore.getAll()) subjects[entry.id] = entry

  const seenRaw = readJson<unknown>(
    await questsStore.get(SEEN_GRADES_KEY),
    null
  )
  const localWallet = await readWallet((key) => shopStore.get(key))
  console.debug(
    "[sync] local wallet earned:",
    Object.keys(localWallet.earned).length,
    "claimed:",
    Object.keys(localWallet.claimed).length
  )
  const local: SyncState = {
    settings,
    subjects,
    wallet: localWallet,
    learn: parseLearn(await learnStore.get(accountId)),
    quests: {
      progress: parseProgress(
        await questsStore.get(PROGRESS_KEY),
        await questsStore.get(LEGACY_REWARDED_KEY)
      ),
      ledger: readJson<Ledger>(await questsStore.get(LEDGER_KEY), {}),
      seenGrades: Array.isArray(seenRaw)
        ? seenRaw.filter((k): k is string => typeof k === "string")
        : null,
    },
  }

  // Log remote wallets
  remotes.forEach((r, i) => {
    console.debug(
      "[sync] remote",
      i,
      "wallet earned:",
      Object.keys(r.wallet.earned).length,
      "claimed:",
      Object.keys(r.wallet.claimed).length
    )
  })

  // ---- Fusion
  const combined = remotes.reduce(mergeStates, local)
  const exchanged = Math.max(
    combined.learn.exchanged,
    exchangedRubies(combined.wallet, accountId)
  )
  const merged = {
    ...combined,
    learn: { ...combined.learn, exchanged },
    wallet: withGemExchange(combined.wallet, accountId, exchanged),
  }
  console.debug(
    "[sync] merged wallet earned:",
    Object.keys(merged.wallet.earned).length,
    "claimed:",
    Object.keys(merged.wallet.claimed).length
  )

  // ---- Écriture : seulement ce qui a changé
  const applied: Applied = {
    settings: [],
    subjects: false,
    wallet: false,
    quests: false,
    learn: false,
  }
  await Promise.all(
    Object.entries(merged.settings).map(async ([key, entry]) => {
      const before = local.settings[key]
      if (before && before.t === entry.t && before.v === entry.v) return
      await settingsStore.put(entry.v, key)
      await metaStore.put(entry.t, `s:${key}`)
      applied.settings.push(key)
    })
  )
  await Promise.all(
    Object.entries(merged.subjects).map(async ([id, entry]) => {
      if (canonical(local.subjects[id]) === canonical(entry)) return
      await subjectsStore.put(entry, id)
      applied.subjects = true
    })
  )
  if (canonical(local.wallet) !== canonical(merged.wallet)) {
    console.debug("[sync] wallet changed, writing")
    await writeWallet(shopStore, merged.wallet)
    applied.wallet = true
  } else {
    console.debug("[sync] wallet unchanged")
  }
  const questParts: [string, unknown, unknown][] = [
    [PROGRESS_KEY, local.quests.progress, merged.quests.progress],
    [LEDGER_KEY, local.quests.ledger, merged.quests.ledger],
    [SEEN_GRADES_KEY, local.quests.seenGrades, merged.quests.seenGrades],
  ]
  await Promise.all(
    questParts.map(async ([key, before, after]) => {
      if (canonical(before) === canonical(after)) return
      await questsStore.put(JSON.stringify(after), key)
      applied.quests = true
    })
  )

  if (canonical(local.learn) !== canonical(merged.learn)) {
    await learnStore.put(merged.learn, accountId)
    applied.learn = true
  }

  await tx.done
  return { state: merged, applied }
}
