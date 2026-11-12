import { useEffect } from "react"
import { weekKey } from "@/features/quests/period"
import { reloadRubies } from "@/features/shop/rubies"
import { spend } from "@/features/shop/wallet"
import { readWallet, writeWallet } from "@/features/shop/walletStore"
import { createStore } from "@/lib/createStore"
import { getDB } from "@/services/storage"
import { markDirty } from "@/services/syncSignal"
import {
  CHEST_TAPS,
  EMPTY_LEARN,
  GEMS_PER_RUBY,
  chestOutcome,
  exchangedRubies,
  gemBalance,
  gemQuests,
  gemsForMistakes,
  mergeLearn,
  parseLearn,
  withGemExchange,
} from "./progress"
import type { LearnProgress } from "./progress"

const store = createStore<Record<string, LearnProgress>>({})

export function publishLearn(account: string, progress: LearnProgress) {
  const current = store.get()
  store.set({
    ...current,
    [account]: mergeLearn(current[account] ?? EMPTY_LEARN, progress),
  })
}

export function useLearnProgress(account: string | undefined) {
  const progress = store.use()
  useEffect(() => {
    if (!account) return
    let active = true
    void getDB()
      .then((db) => db.get("learn", account))
      .then((value) => {
        if (active) publishLearn(account, parseLearn(value))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [account])
  return account ? progress[account] : undefined
}

export async function completeCheckpoint(
  account: string,
  id: string,
  mistakes: number
) {
  const db = await getDB()
  const tx = db.transaction("learn", "readwrite")
  const progress = parseLearn(await tx.store.get(account))
  const previous = Object.hasOwn(progress.results, id)
    ? progress.results[id]
    : undefined
  const best = Math.min(previous ?? 10, mistakes)
  if (best === previous) {
    await tx.done
    return { best, gained: 0 }
  }
  progress.results = { ...progress.results, [id]: best }
  progress.earnedWeeks = { ...progress.earnedWeeks }
  const earnedBefore = previous === undefined ? 0 : gemsForMistakes(previous)
  const earned = gemsForMistakes(best)
  const week = weekKey(new Date())
  for (let amount = earnedBefore + 5; amount <= earned; amount += 5) {
    progress.earnedWeeks[`checkpoint-${id}-${amount}`] = week
  }
  await tx.store.put(progress, account)
  await tx.done
  publishLearn(account, progress)
  markDirty()
  return {
    best,
    gained: earned - earnedBefore,
  }
}

export async function tapChest(
  account: string,
  id: string,
  prerequisites: string[]
) {
  const db = await getDB()
  const tx = db.transaction(["learn", "shop"], "readwrite")
  const learn = tx.objectStore("learn")
  const progress = parseLearn(await learn.get(account))
  const previous = progress.chests[id] ?? 0
  if (
    previous === CHEST_TAPS ||
    !prerequisites.every((key) => Object.hasOwn(progress.results, key))
  ) {
    await tx.done
    return previous
  }

  const taps = previous + 1
  progress.chests = { ...progress.chests, [id]: taps }
  if (taps === CHEST_TAPS) {
    progress.earnedWeeks = {
      ...progress.earnedWeeks,
      [id]: weekKey(new Date()),
    }
  }
  const itemId =
    taps === CHEST_TAPS ? chestOutcome(account, id, taps).itemId : undefined
  if (itemId) {
    const shop = tx.objectStore("shop")
    const wallet = await readWallet((key) => shop.get(key))
    const unlocked = spend(wallet, itemId, 0)
    if (unlocked !== wallet) await writeWallet(shop, unlocked)
  }
  await learn.put(progress, account)
  await tx.done
  publishLearn(account, progress)
  if (itemId) void reloadRubies()
  markDirty()
  return taps
}

export async function completeLearningActivity(
  account: string,
  kind: "practice" | "revisions",
  id: string
) {
  const db = await getDB()
  const tx = db.transaction("learn", "readwrite")
  const progress = parseLearn(await tx.store.get(account))
  if (Object.hasOwn(progress[kind], id)) {
    await tx.done
    return
  }
  progress[kind] = { ...progress[kind], [id]: 1 }
  await tx.store.put(progress, account)
  await tx.done
  publishLearn(account, progress)
  markDirty()
}

export async function claimGemQuests(account: string) {
  const db = await getDB()
  const tx = db.transaction("learn", "readwrite")
  const progress = parseLearn(await tx.store.get(account))
  const pending = gemQuests(progress).filter(
    ({ state, claimed }) => state === "achieved" && !claimed
  )
  const week = weekKey(new Date())
  progress.earnedWeeks = {
    ...progress.earnedWeeks,
    ...Object.fromEntries(pending.map(({ id }) => [`quest-${id}`, week])),
  }
  if (pending.length) await tx.store.put(progress, account)
  await tx.done
  publishLearn(account, progress)
  if (pending.length) markDirty()
  return pending.reduce((total, { reward }) => total + reward, 0)
}

export async function exchangeGems(account: string, rubies: number) {
  const db = await getDB()
  const tx = db.transaction(["learn", "shop"], "readwrite")
  const learn = tx.objectStore("learn")
  const shop = tx.objectStore("shop")
  const progress = parseLearn(await learn.get(account))
  const wallet = await readWallet((key) => shop.get(key))
  progress.exchanged = Math.max(
    progress.exchanged,
    exchangedRubies(wallet, account)
  )
  if (
    !Number.isSafeInteger(rubies) ||
    rubies <= 0 ||
    gemBalance(progress, account) < rubies * GEMS_PER_RUBY
  ) {
    await tx.done
    return false
  }
  progress.exchanged += rubies
  await writeWallet(shop, withGemExchange(wallet, account, progress.exchanged))
  await learn.put(progress, account)
  await tx.done
  publishLearn(account, progress)
  markDirty()
  await reloadRubies()
  return true
}
