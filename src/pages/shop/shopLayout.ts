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
  halloween: new Date("2026-11-09T09:00:00"), // the Monday after the 2026 edition
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
}

interface CollectionDef {
  id: (typeof COLLECTION_ORDER)[number]
  label: string
  hint: string
  entries: ShopEntry[]
  endsAt?: Date // set while the limited edition is still running
}

// One decorated section per collection, then all the permanent colors.
// Every card is the same size: the shop reads as one uniform shelf.
export function layoutShop(
  entries: ShopEntry[],
  now = new Date()
): {
  collections: CollectionDef[]
  colors: ShopEntry[]
} {
  // Items sold only inside a pack never get their own card.
  const shoppable = entries.filter((entry) => !entry.item.packOnly)

  const collections: CollectionDef[] = []
  for (const id of COLLECTION_ORDER) {
    const def = COLLECTIONS[id]
    const group = shoppable.filter((entry) => entry.item.collection === id)
    if (group.length === 0) continue
    const endsAt = DEADLINES[id]
    if (endsAt && now >= endsAt) continue // the limited edition is over
    collections.push({
      id,
      label: def.label,
      hint: def.hint,
      entries: group,
      endsAt,
    })
  }

  const permanent = shoppable.filter((entry) => {
    const id = entry.item.collection
    if (!id) return true
    if (!(id in COLLECTIONS)) return true // catalog surgery: keep showing
    const endsAt = DEADLINES[id as keyof typeof DEADLINES]
    if (!endsAt) return false // the live collection owns the card
    // The edition just ended: only kept purchases fall back. Packs vanish
    // (the members' cards cover what remains).
    return now >= endsAt && entry.owned && entry.item.kind !== "bundle"
  })

  return {
    collections,
    // Packs float to the top of the permanent section (the hero cards),
    // then the colors and themes keep the catalog order.
    colors: [
      ...permanent.filter((entry) => entry.item.kind === "bundle"),
      ...permanent.filter((entry) => entry.item.kind !== "bundle"),
    ],
  }
}
