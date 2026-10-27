// Pure shop logic: catalog, purchases, weekly recap. No React, no IndexedDB.
//
// ADD AN ITEM -> add one object to SHOP_ITEMS. (A new `kind` also needs a
//                place that applies it, like the accent picker does.)

// Keys of the "shop" IndexedDB store (the ruby balance key lives in rubies.ts).
export const OWNED_KEY = "owned"
export const WEEKS_KEY = "weekly"

export interface ShopItem {
  id: string // never change an id once shipped: purchases are stored by id
  kind: "accent"
  label: string
  price: number
  value: string // accent key stored in the "accent-color" setting
  color: string // hex shown in the shop and in the picker
  foreground: string // text color readable on top of `color`
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "accent-violet",
    kind: "accent",
    label: "Violet",
    price: 150,
    value: "violet",
    color: "#8b5cf6",
    foreground: "#ffffff",
  },
  {
    id: "accent-pink",
    kind: "accent",
    label: "Rose",
    price: 150,
    value: "pink",
    color: "#ec4899",
    foreground: "#ffffff",
  },
  {
    id: "accent-orange",
    kind: "accent",
    label: "Orange",
    price: 150,
    value: "orange",
    color: "#f97316",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-teal",
    kind: "accent",
    label: "Turquoise",
    price: 150,
    value: "teal",
    color: "#14b8a6",
    foreground: "#1a1a1a",
  },
]

// ---- Purchase ------------------------------------------------------------

export type PurchaseStatus = "ok" | "owned" | "poor"

export function purchase(
  item: ShopItem,
  balance: number,
  owned: string[]
): { status: PurchaseStatus; balance: number; owned: string[] } {
  if (owned.includes(item.id)) return { status: "owned", balance, owned }
  if (balance < item.price) return { status: "poor", balance, owned }
  return {
    status: "ok",
    balance: balance - item.price,
    owned: [...owned, item.id],
  }
}

export function parseOwned(raw: unknown): string[] {
  try {
    if (typeof raw !== "string") return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : []
  } catch {
    return []
  }
}

// ---- Weekly recap ("beat your last week", never "beat the others") -------

export type WeekStats = Record<string, number> // week key -> rubies earned

const KEPT_WEEKS = 12

export function addToWeek(
  stats: WeekStats,
  week: string,
  amount: number
): WeekStats {
  const next: WeekStats = { ...stats, [week]: (stats[week] ?? 0) + amount }
  const keep = Object.keys(next).sort().slice(-KEPT_WEEKS)
  return Object.fromEntries(keep.map((key) => [key, next[key]]))
}

export function parseWeeks(raw: unknown): WeekStats {
  try {
    if (typeof raw !== "string") return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number"
      )
    )
  } catch {
    return {}
  }
}

export interface WeekSummary {
  thisWeek: number
  lastWeek: number
  best: number // best of the *previous* weeks
}

export function weekSummary(
  stats: WeekStats,
  thisKey: string,
  lastKey: string
): WeekSummary {
  const best = Math.max(
    0,
    ...Object.entries(stats)
      .filter(([key]) => key !== thisKey)
      .map(([, value]) => value)
  )
  return {
    thisWeek: stats[thisKey] ?? 0,
    lastWeek: stats[lastKey] ?? 0,
    best,
  }
}

// One encouraging sentence, or null when there is nothing nice to say yet.
// Never mentions a loss: a bad week simply shows nothing.
export function weekMessage({
  thisWeek,
  lastWeek,
  best,
}: WeekSummary): string | null {
  if (thisWeek <= 0) return null
  if (best > 0 && thisWeek > best) {
    return `Record personnel : +${thisWeek} cette semaine`
  }
  if (lastWeek > 0 && thisWeek >= lastWeek) {
    return `+${thisWeek} cette semaine : tu fais mieux que la semaine dernière`
  }
  return `+${thisWeek} rubis cette semaine`
}
