// Pure shop logic: catalog, purchases, weekly recap. No React, no IndexedDB.
//
// ADD AN ITEM -> add one object to SHOP_ITEMS. (A new `kind` also needs a
//                place that applies it, like the accent picker does.)

import {
  Backpack01Icon,
  GarlandsIcon,
  GiftIcon,
  PineTreeIcon,
  PumpkinIcon,
} from "@hugeicons/core-free-icons"
import { type DecoThemeId, DECO_THEMES, isDecoThemeId } from "./decoThemes"

// Keys of the "shop" IndexedDB store (the ruby balance key lives in rubies.ts).
export const OWNED_KEY = "owned"
export const WEEKS_KEY = "weekly"

// Base shape of a catalog entry; every `kind` extends it.
interface BaseShopItem {
  id: string // never change an id once shipped: purchases are stored by id
  kind: ShopItem["kind"]
  label: string
  description: string // shown in the item dialog
  price: number
  originalPrice?: number // set when the item is on sale
  color: string // hex shown in the shop and in the picker
  foreground: string // text color readable on top of `color`
  image?: string // css gradient painted over `color` (shop bubble + primary surfaces)
  collection?: string // limited editions, grouped in their own section (see shopLayout)
  packOnly?: boolean // sold only inside a pack: never given its own shelf card
  icon?: typeof GiftIcon // shop logo, when the item deserves its own visual
  featured?: boolean // shown bigger than the uniform shelf (the hero pack)
}

export interface AccentShopItem extends BaseShopItem {
  kind: "accent"
  value: string // accent key stored in the "accent-color" setting
}

export interface ThemeShopItem extends BaseShopItem {
  kind: "theme"
  value: DecoThemeId // deco theme id stored in the "deco-theme" setting
}

// A pack: grants several member items at once, for less than their sum.
// Members must never change: buying a pack writes their ids in "owned".
// The accent setting holds a single color: "Utiliser" turns on the theme
// and the first accent, and the pack stays "in use" while the chosen color
// is one of its own.
export interface BundleShopItem extends BaseShopItem {
  kind: "bundle"
  items: string[]
}

export type ShopItem = AccentShopItem | ThemeShopItem | BundleShopItem

export const SHOP_ITEMS: ShopItem[] = [
  // ---- Avant-première Noël (en tête de boutique, en accès anticipé) -----
  {
    id: "pack-noel",
    kind: "bundle",
    label: "Pack Noël",
    description:
      "Le Rouge houx et le Thème Noël, ensemble pour 450 au lieu de 600.",
    price: 400,
    originalPrice: 600,
    items: ["accent-houx", "theme-noel"],
    icon: GarlandsIcon,
    featured: true,
    color: "#b91c1c",
    foreground: "#ffffff",
    collection: "noel",
  },
  {
    id: "accent-houx",
    kind: "accent",
    label: "Rouge houx",
    description: "Le rouge des bougies et des guirlandes de décembre.",
    price: 200,
    originalPrice: 250,
    value: "houx",
    color: "#b91c1c",
    foreground: "#ffffff",
    collection: "noel",
  },
  {
    id: "accent-sapin",
    kind: "accent",
    label: "Sapin",
    description: "Le vert des sapins que la première neige recouvre.",
    price: 300,
    value: "sapin",
    color: "#166534",
    foreground: "#ffffff",
    collection: "noel",
  },
  {
    id: "accent-neige",
    kind: "accent",
    label: "Blanc neige",
    description: "Un blanc de première neige, encore intact.",
    price: 400,
    value: "neige",
    color: "#f1f5f9",
    foreground: "#1a1a1a",
    collection: "noel",
  },
  {
    id: "theme-noel",
    kind: "theme",
    label: "Thème Noël",
    description:
      "Un cadeau se pose sur ta moyenne, des flocons et des guirlandes s'invitent au bas des pages. Et il neige derrière les cartes.",
    price: 400,
    originalPrice: 500,
    value: "noel",
    icon: PineTreeIcon,
    color: "#ef4444",
    foreground: "#ffffff",
    collection: "noel",
  },
  // ---- Exclusivité Halloween (s'arrête le lundi 9 nov, voir shopLayout) --
  {
    id: "pack-halloween-2026",
    kind: "bundle",
    label: "Pack Halloween 2026",
    description:
      "Les 3 couleurs Spooky et le Thème Halloween 2026 réunis, pour 67 au lieu de 475.",
    price: 67,
    originalPrice: 475,
    items: [
      "accent-orange",
      "accent-sorciere",
      "accent-fantome",
      "theme-halloween2026",
    ],
    icon: PumpkinIcon,
    featured: true,
    color: "#c2410c",
    foreground: "#ffffff",
    collection: "halloween",
  },
  {
    id: "accent-orange",
    kind: "accent",
    label: "Orange Spooky",
    description:
      "L'orange brûlé des nuits d'Halloween : potirons, bonbons, devoirs finis.",
    price: 100,
    originalPrice: 150,
    value: "orange",
    color: "#c2410c",
    foreground: "#ffffff",
    collection: "halloween",
  },
  {
    id: "accent-sorciere",
    kind: "accent",
    label: "Violet Spooky",
    description: "Le violet de minuit, allumé à la dernière lampe.",
    price: 175,
    originalPrice: 250,
    value: "sorciere",
    color: "#4c1d95",
    foreground: "#ffffff",
    collection: "halloween",
  },
  {
    id: "accent-fantome",
    kind: "accent",
    label: "Fantôme Spooky",
    description: "Un gris de brume qui glisse dans les couloirs du CDI.",
    price: 200,
    originalPrice: 300,
    value: "fantome",
    color: "#94a3b8",
    foreground: "#1a1a1a",
    collection: "halloween",
  },
  {
    id: "theme-halloween2026",
    kind: "theme",
    label: "Thème Halloween 2026",
    description:
      "Une citrouille se pose sur ta moyenne, fantômes et bonbons s'invitent au bas des pages.",
    price: 0, // pack-only: never sold on its own shelf
    value: "halloween2026",
    color: "#c2410c",
    foreground: "#ffffff",
    packOnly: true,
    collection: "halloween",
  },
  // ---- Couleurs permanentes ---------------------------------------------
  {
    id: "accent-violet",
    kind: "accent",
    label: "Violet",
    description: "Le violet des grandes idées.",
    price: 150,
    value: "violet",
    color: "#8b5cf6",
    foreground: "#ffffff",
  },
  {
    id: "accent-teal",
    kind: "accent",
    label: "Turquoise",
    description: "L'eau claire des vacances d'été.",
    price: 150,
    value: "teal",
    color: "#0d9488",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-cobalt",
    kind: "accent",
    label: "Cobalt",
    description: "Un bleu franc, taillé pour viser haut.",
    price: 200,
    originalPrice: 250,
    value: "cobalt",
    color: "#1d4ed8",
    foreground: "#ffffff",
  },
  {
    id: "accent-pink",
    kind: "accent",
    label: "Rose",
    description: "Une couleur qui ne passe jamais inaperçue.",
    price: 300,
    value: "pink",
    color: "#db2777",
    foreground: "#ffffff",
  },
  {
    id: "accent-aurore",
    kind: "accent",
    label: "Aurore",
    description: "Un cyan électrique, comme une aurore boréale.",
    price: 500,
    value: "aurore",
    color: "#22d3ee",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-or",
    kind: "accent",
    label: "Or",
    description: "La couleur des records battus.",
    price: 750,
    value: "or",
    color: "#ca8a04",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-pain-epice",
    kind: "accent",
    label: "Pain d'épice",
    description: "Le brun doré des goûters de décembre.",
    price: 250,
    value: "pain-epice",
    color: "#a0522d",
    foreground: "#ffffff",
    collection: "noel",
  },
  {
    id: "accent-sucre-orge",
    kind: "accent",
    label: "Sucre d'orge",
    description:
      "Le dégradé du blanc au rouge bonbon, comme le sucre d'orge des fêtes.",
    price: 300,
    value: "sucre-orge",
    color: "#e11d48",
    foreground: "#ffffff",
    image:
      "radial-gradient(140% 140% at 50% 35%, #e11d48 0%, #ff8fa3 55%, #ffffff 115%)",
    collection: "noel",
  },
  {
    id: "accent-menthe",
    kind: "accent",
    label: "Menthe",
    description: "Le vert frais de la rentrée, encore tout neuf.",
    price: 150,
    value: "menthe",
    color: "#34d399",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-orange-clair",
    kind: "accent",
    label: "Orange",
    description: "L'orange des boîtes de crayons, bien vif.",
    price: 150,
    value: "orange-clair",
    color: "#fb923c",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-bordeaux",
    kind: "accent",
    label: "Bordeaux",
    description:
      "Le rouge le plus foncé de la boutique : profond, sérieux, chic.",
    price: 150,
    value: "bordeaux",
    color: "#641220",
    foreground: "#ffffff",
  },
  // ---- Thèmes décorés : des petits objets s'invitent dans l'app ---------
  {
    id: "theme-jeux",
    kind: "theme",
    label: "Thème Jeux vidéo",
    description:
      "Une manette se pose sur ta moyenne, des dés et des hauts scores s'invitent au bas des pages.",
    price: 450,
    value: "jeux",
    color: "#7c3aed",
    foreground: "#ffffff",
  },
  {
    id: "theme-sport",
    kind: "theme",
    label: "Thème Sport",
    description:
      "Un trophée se pose sur ta moyenne, ballons et sifflets s'invitent au bas des pages.",
    price: 400,
    value: "sport",
    color: "#f97316",
    foreground: "#ffffff",
  },
  {
    id: "theme-ecole",
    kind: "theme",
    label: "Thème École",
    description:
      "La toque se pose sur ta moyenne, règle et cartable s'invitent au bas des pages.",
    price: 400,
    value: "school",
    color: "#65a30d",
    foreground: "#ffffff",
  },
  // ---- Packs : une couleur + un thème, moins cher que séparément ---------
  {
    id: "pack-gamer",
    kind: "bundle",
    label: "Pack Gamer",
    description:
      "Le Cobalt et le Thème Jeux vidéo réunis, pour 500 au lieu de 650.",
    price: 500,
    originalPrice: 650,
    items: ["accent-cobalt", "theme-jeux"],
    featured: true,
    color: "#1d4ed8",
    foreground: "#ffffff",
  },
  {
    id: "pack-champion",
    kind: "bundle",
    label: "Pack Champion",
    description: "L'Or et le Thème Sport réunis, pour 900 au lieu de 1150.",
    price: 900,
    originalPrice: 1150,
    items: ["accent-or", "theme-sport"],
    featured: true,
    color: "#ca8a04",
    foreground: "#1a1a1a",
  },
  {
    id: "pack-etudiant",
    kind: "bundle",
    label: "Pack Étudiant",
    description: "La Menthe et le Thème École réunis, pour 425 au lieu de 550.",
    price: 425,
    originalPrice: 550,
    items: ["accent-menthe", "theme-ecole"],
    icon: Backpack01Icon,
    featured: true,
    color: "#65a30d",
    foreground: "#ffffff",
  },
]

// The shop-bubble logo: an explicit icon when the item carries one (the
// festive items), else the theme's mascot, the gift for the other packs and
// nothing for plain colors.
export function shopItemIcon(
  item: ShopItem
): { icon: typeof GiftIcon; color: string } | null {
  if (item.icon) return { icon: item.icon, color: item.foreground }
  if (item.kind === "theme" && isDecoThemeId(item.value)) {
    return {
      icon: DECO_THEMES[item.value].mascots[0].icon,
      color: item.foreground,
    }
  }
  if (item.kind === "bundle") return { icon: GiftIcon, color: item.foreground }
  return null
}

// ---- Purchase ------------------------------------------------------------

export type PurchaseStatus = "ok" | "owned" | "poor"

export function purchase(
  item: ShopItem,
  balance: number,
  owned: string[]
): { status: PurchaseStatus; balance: number; owned: string[] } {
  const ownedSet = new Set(owned)
  if (item.kind === "bundle") {
    // A pack grants its not-yet-owned members in one go: the pack price is
    // always the (cheaper) total, even when some members were bought before.
    const missing = item.items.filter((id) => !ownedSet.has(id))
    if (missing.length === 0) return { status: "owned", balance, owned }
    if (balance < item.price) return { status: "poor", balance, owned }
    return {
      status: "ok",
      balance: balance - item.price,
      owned: [...owned, ...missing],
    }
  }
  if (ownedSet.has(item.id)) return { status: "owned", balance, owned }
  if (balance < item.price) return { status: "poor", balance, owned }
  return {
    status: "ok",
    balance: balance - item.price,
    owned: [...owned, item.id],
  }
}

// Owned flag of a catalog entry: a color/theme by its id, a pack once every
// member is owned (the pack id itself is never written).
export function itemOwned(item: ShopItem, owned: string[]): boolean {
  if (item.kind === "bundle") {
    const ownedSet = new Set(owned)
    return item.items.every((id) => ownedSet.has(id))
  }
  return owned.includes(item.id)
}

// id -> item, built once: pack member lookups run on every card render.
const ITEM_BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]))

// Active flag: a color when selected as accent, a theme when it decorates,
// a pack when ALL its members are active at once ("Retirer" clears them).
export function itemActive(
  item: ShopItem,
  accentColor: string,
  decoTheme: string
): boolean {
  if (item.kind === "bundle") {
    const members = item.items.flatMap((id) => {
      const member = ITEM_BY_ID.get(id)
      return member && member.kind !== "bundle" ? [member] : []
    })
    // The accent setting holds a single color: the pack is "in use" while
    // its theme decorates and the chosen color is one of its own.
    return (
      members
        .filter((member) => member.kind === "theme")
        .every((member) => itemActive(member, accentColor, decoTheme)) &&
      members.some(
        (member) =>
          member.kind === "accent" && itemActive(member, accentColor, decoTheme)
      )
    )
  }
  if (item.kind === "theme") return decoTheme === item.value
  return accentColor === item.value
}

// The accent members of a pack, in order. The drawer asks which one to use
// when there are several (the accent setting holds a single color).
export function packAccents(item: ShopItem): AccentShopItem[] {
  if (item.kind !== "bundle") return []
  return item.items.flatMap((id) => {
    const member = ITEM_BY_ID.get(id)
    return member && member.kind === "accent" ? [member] : []
  })
}

// The theme member of a pack (the invariant guarantees exactly one).
export function packTheme(item: ShopItem): ThemeShopItem | undefined {
  if (item.kind !== "bundle") return undefined
  return item.items.flatMap((id) => {
    const member = ITEM_BY_ID.get(id)
    return member && member.kind === "theme" ? [member] : []
  })[0]
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

// Discount shown on sale items, rounded to a whole percent (e.g. 100 out of
// 150 -> 33). Null when there is nothing to cross out.
export function discountPercent(
  price: number,
  originalPrice: number | undefined
): number | null {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
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

interface WeekSummary {
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
