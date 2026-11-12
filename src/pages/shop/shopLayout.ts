import type { ShopItem } from "@/features/shop/shopRules"

// Limited-edition collections, in display order: the Christmas preview
// first, then the limited editions. Every collection used in the catalog
// must be listed here.
export const COLLECTIONS: Record<string, { label: string }> = {
  noel: { label: "Noël" },
  halloween: { label: "Exclusivité Halloween" },
}

const COLLECTION_ORDER = ["noel", "halloween"] as const

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
  coded?: boolean // a redeemed price code lowers this item
}

interface CollectionDef {
  id: (typeof COLLECTION_ORDER)[number]
  label: string
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
    // Use per-item dates (all items in a collection share the same dates)
    const startsAt = group[0]?.item.startsAt
    const endsAt = group[0]?.item.endsAt
    if (startsAt && now < startsAt) continue // the limited edition hasn't started yet
    if (endsAt && now >= endsAt) continue // the limited edition is over
    collections.push({
      id,
      label: def.label,
      entries: withFeaturedTheme(group),
      endsAt,
    })
  }

  const permanent = entries.filter((entry) => {
    // Collection items live only in their own section, never under
    // "Couleurs & thèmes", even while their edition is running.
    if (entry.item.collection) return false
    const startsAt = entry.item.startsAt
    const endsAt = entry.item.endsAt
    // Items without event dates are always permanent colors/themes
    if (!startsAt && !endsAt) return true
    // Items not yet started are not shown
    if (startsAt && now < startsAt) return false
    // Items past their end date are not shown
    if (endsAt && now >= endsAt) return false
    // Items within their window are shown
    return true
  })

  return {
    collections,
    colors: withFeaturedTheme(permanent),
  }
}
