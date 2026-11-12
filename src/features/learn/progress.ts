import type { Wallet } from "@/features/shop/wallet"

export interface LearnProgress {
  results: Record<string, number>
  chests: Record<string, number>
  practice: Record<string, number>
  revisions: Record<string, number>
  earnedWeeks: Record<string, string>
  exchanged: number
}

export const CHEST_TAPS = 5
export const GEMS_PER_RUBY = 10
export const EMPTY_LEARN: LearnProgress = {
  results: {},
  chests: {},
  practice: {},
  revisions: {},
  earnedWeeks: {},
  exchanged: 0,
}

export function gemsForMistakes(mistakes: number): number {
  return [20, 15, 10][mistakes] ?? 5
}

function counts(
  value: unknown,
  max: number,
  min: number
): Record<string, number> {
  if (!value || typeof value !== "object") return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      ([id, count]) =>
        /^[a-z0-9][a-z0-9-]{1,63}$/.test(id) &&
        Number.isInteger(count) &&
        count >= min &&
        count <= max
    )
  )
}

export function parseLearn(value: unknown): LearnProgress {
  if (!value || typeof value !== "object") return { ...EMPTY_LEARN }
  const raw = value as Partial<LearnProgress>
  const weeks = raw.earnedWeeks
  return {
    results: counts(raw.results, 10, 0),
    chests: counts(raw.chests, CHEST_TAPS, 1),
    practice: counts(raw.practice, 1, 1),
    revisions: counts(raw.revisions, 1, 1),
    earnedWeeks:
      weeks && typeof weeks === "object"
        ? Object.fromEntries(
            Object.entries(weeks).filter(
              ([id, week]) =>
                /^[a-z0-9-]{2,80}$/u.test(id) &&
                typeof week === "string" &&
                /^\d{4}-\d{2}-\d{2}$/u.test(week)
            )
          )
        : {},
    exchanged:
      typeof raw.exchanged === "number" &&
      Number.isSafeInteger(raw.exchanged) &&
      raw.exchanged > 0
        ? raw.exchanged
        : 0,
  }
}

export function mergeLearn(a: LearnProgress, b: LearnProgress): LearnProgress {
  const results = { ...a.results, ...b.results }
  const chests = { ...a.chests, ...b.chests }
  for (const [id, score] of Object.entries(a.results)) {
    if (Object.hasOwn(b.results, id))
      results[id] = Math.min(score, b.results[id])
  }
  for (const [id, taps] of Object.entries(a.chests)) {
    if (Object.hasOwn(b.chests, id)) chests[id] = Math.max(taps, b.chests[id])
  }
  const earnedWeeks = { ...a.earnedWeeks, ...b.earnedWeeks }
  for (const [id, week] of Object.entries(a.earnedWeeks)) {
    if (week < (earnedWeeks[id] ?? week)) earnedWeeks[id] = week
  }
  return {
    results,
    chests,
    earnedWeeks,
    practice: { ...a.practice, ...b.practice },
    revisions: { ...a.revisions, ...b.revisions },
    exchanged: Math.max(a.exchanged, b.exchanged),
  }
}

const RARITIES = ["Commun", "Rare", "Épique", "Mythique", "Légendaire"] as const
const UPGRADE_ODDS = [0.62, 0.48, 0.32, 0.2]
const CHEST_GEMS = [10, 20, 35, 60, 100]
const ACCENTS = ["accent-menthe", "accent-cobalt", "accent-or", "accent-aurore"]

// Un même coffre donne le même tirage hors ligne sur tous les appareils.
function roll(key: string): number {
  let hash = 2166136261
  for (let index = 0; index < key.length; index++) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32
}

export function chestOutcome(account: string, id: string, taps: number) {
  const key = `${account}:${id}`
  let tier = 0
  for (let tap = 1; tap <= taps && tier < RARITIES.length - 1; tap++) {
    if (roll(`${key}:tap:${tap}`) < UPGRADE_ODDS[tier]) tier++
  }
  const rarity = RARITIES[tier]
  const draw = roll(`${key}:prize`)
  const itemId =
    tier === 4 && draw < 0.01
      ? "theme-ecole"
      : tier >= 3 && draw < (tier === 4 ? 0.07 : 0.015)
        ? ACCENTS[Math.floor(roll(`${key}:accent`) * ACCENTS.length)]
        : undefined
  return { tier, rarity, itemId, gems: itemId ? 0 : CHEST_GEMS[tier] }
}

const GEM_QUESTS = [
  {
    id: "premier-pas",
    title: "Premier pas",
    description: "Termine ton premier checkpoint.",
    goal: 1,
    reward: 10,
    metric: "checkpoints",
  },
  {
    id: "entrainement",
    title: "À toi de jouer",
    description: "Termine des exercices dans 3 chapitres différents.",
    goal: 3,
    reward: 15,
    metric: "practice",
  },
  {
    id: "sans-faute",
    title: "Sans faute",
    description: "Réussis un checkpoint avec 10 bonnes réponses.",
    goal: 1,
    reward: 15,
    metric: "perfect",
  },
  {
    id: "premier-coffre",
    title: "Chasse au trésor",
    description: "Ouvre un coffre du parcours.",
    goal: 1,
    reward: 20,
    metric: "chests",
  },
] as const

export function gemQuests(progress: LearnProgress) {
  const results = Object.values(progress.results)
  const counts = {
    checkpoints: results.length,
    practice: Object.keys(progress.practice).length,
    perfect: results.filter((mistakes) => mistakes === 0).length,
    chests: Object.values(progress.chests).filter((taps) => taps === CHEST_TAPS)
      .length,
  }
  return GEM_QUESTS.map(({ metric, ...quest }) => {
    const count = Math.min(quest.goal, counts[metric])
    return {
      ...quest,
      count,
      state:
        count === quest.goal ? ("achieved" as const) : ("unachieved" as const),
      claimed: Object.hasOwn(progress.earnedWeeks, `quest-${quest.id}`),
    }
  })
}

export function gemBalance(progress: LearnProgress, account: string): number {
  let total = Object.values(progress.results).reduce(
    (sum, mistakes) => sum + gemsForMistakes(mistakes),
    0
  )
  for (const [id, taps] of Object.entries(progress.chests)) {
    if (taps === CHEST_TAPS) total += chestOutcome(account, id, taps).gems
  }
  for (const quest of gemQuests(progress)) {
    if (quest.claimed && quest.state === "achieved") total += quest.reward
  }
  return Math.max(0, total - progress.exchanged * GEMS_PER_RUBY)
}

export function gemsEarnedInWeek(
  progress: LearnProgress,
  account: string,
  week: string
) {
  let total = 0
  for (const [id, mistakes] of Object.entries(progress.results)) {
    for (let amount = 5; amount <= gemsForMistakes(mistakes); amount += 5) {
      if (progress.earnedWeeks[`checkpoint-${id}-${amount}`] === week)
        total += 5
    }
  }
  for (const [id, taps] of Object.entries(progress.chests)) {
    if (taps === CHEST_TAPS && progress.earnedWeeks[id] === week)
      total += chestOutcome(account, id, taps).gems
  }
  for (const quest of gemQuests(progress)) {
    if (
      quest.state === "achieved" &&
      progress.earnedWeeks[`quest-${quest.id}`] === week
    )
      total += quest.reward
  }
  return total
}

// Les échanges des mêmes tranches de dix se fusionnent en un seul crédit.
export function exchangedRubies(wallet: Wallet, account: string) {
  return wallet.gifts[`learn-exchange:${account}`] ?? 0
}

export function withGemExchange(
  wallet: Wallet,
  account: string,
  exchanged: number
): Wallet {
  if (exchanged <= exchangedRubies(wallet, account)) return wallet
  const key = `learn-exchange:${account}`
  return { ...wallet, gifts: { ...wallet.gifts, [key]: exchanged } }
}
