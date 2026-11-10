import type { ShopItem } from "@/features/shop/shopRules"

// Limited-edition collections, in display order: the Christmas preview
// first, then the limited editions. Every collection used in the catalog
// must be listed here.
export const COLLECTIONS: Record<string, { label: string; hint: string }> = {
  noel: { label: "Avant-première Noël", hint: "En exclusivité" },
  halloween: { label: "Exclusivité Halloween", hint: "Édition limitée" },
}

const COLLECTION_ORDER = ["noel", "halloween"] as const

// Hard shelves-off dates per collection: once the line passes, the whole
// category vanishes from the shop; kept purchases stay usable. Times are
// read in the local timezone.
const DEADLINES: Partial<Record<(typeof COLLECTION_ORDER)[number], Date>> = {
  halloween: new Date("2026-11-12T09:00:00"), // the Thursday after the 2026 edition
}

// Start dates: a collection is hidden until this date (local time).
// Christmas appears after Halloween ends (Nov 12).
const START_DATES: Partial<Record<(typeof COLLECTION_ORDER)[number], Date>> = {
  noel: new Date("2026-11-12T09:00:00"),
}

// "5 j 23 h", "2 h 50 min", "30 min" — the text after "Fin dans" on the
// limited pack card. Empty once the deadline passed.
export function countdownLabel(now: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - now.getTime()) / 60_000)
  if (minutes <= 0) return ""
  if (minutes < 60) return `${minutes} min`
  const restMinutes = minutes % 60
  const hours = Math.floor(minutes / 60)
  if (hours < 24)
    return restMinutes === 0
      ? `${hours} h`
      : `${hours} h ${String(restMinutes).padStart(2, "0")} min`
  const days = Math.floor(hours / 24)
  return hours % 24 === 0 ? `${days} j` : `${days} j ${hours % 24} h`
}

export interface ShopEntry {
  item: ShopItem
  owned: boolean
  active: boolean
  missing: number // rubies still missing (0 = affordable)
  featured?: boolean // the shelf's headliner theme
}

interface CollectionDef {
  id: (typeof COLLECTION_ORDER)[number]
  label: string
  hint: string
  entries: ShopEntry[]
  endsAt?: Date // set while the limited edition is still running
}

// One theme per shelf sits on top and runs full width: it is the shelf's
// headliner, so the other themes stay in the uniform grid below it.
function withFeaturedTheme(entries: ShopEntry[]): ShopEntry[] {
  const featured = entries.find((entry) => entry.item.kind === "theme")
  if (!featured) return entries
  return [
    { ...featured, featured: true },
    ...entries.filter((entry) => entry !== featured),
  ]
}

// One decorated section per collection, then all the permanent colors and
// themes. Every card is the same size except the shelf's single theme.
export function layoutShop(
  entries: ShopEntry[],
  now = new Date()
): {
  collections: CollectionDef[]
  colors: ShopEntry[]
} {
  const collections: CollectionDef[] = []
  for (const id of COLLECTION_ORDER) {
    const def = COLLECTIONS[id]
    const group = entries.filter((entry) => entry.item.collection === id)
    if (group.length === 0) continue
    const startsAt = START_DATES[id]
    if (startsAt && now < startsAt) continue // the limited edition hasn't started yet
    const endsAt = DEADLINES[id]
    if (endsAt && now >= endsAt) continue // the limited edition is over
    collections.push({
      id,
      label: def.label,
      hint: def.hint,
      entries: withFeaturedTheme(group),
      endsAt,
    })
  }

  const permanent = entries.filter((entry) => {
    const id = entry.item.collection
    if (!id) return true
    if (!(id in COLLECTIONS)) return true // catalog surgery: keep showing
    const startsAt = START_DATES[id as keyof typeof START_DATES]
    if (startsAt && now < startsAt) return false // the edition hasn't started yet
    const endsAt = DEADLINES[id as keyof typeof DEADLINES]
    if (!endsAt) return false // the live collection owns the card
    return now >= endsAt && entry.owned
  })

  return {
    collections,
    colors: withFeaturedTheme(permanent),
  }
}
