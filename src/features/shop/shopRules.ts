// Pure shop logic: catalog, purchases, weekly recap. No React, no IndexedDB.
//
// ADD AN ITEM -> add one object to SHOP_ITEMS. (A new `kind` also needs a
//                place that applies it, like the accent picker does.)

import { GiftIcon, PineTreeIcon } from "@hugeicons/core-free-icons"
import { type DecoThemeId, DECO_THEMES, isDecoThemeId } from "./decoThemes"

// Base shape of a catalog entry; every `kind` extends it.
interface BaseShopItem {
  id: string // never change an id once shipped: purchases are stored by id
  label: string
  description: string // shown in the item dialog
  price: number
  originalPrice?: number // set when the item is on sale
  color: string // hex shown in the shop and in the picker
  foreground: string // text color readable on top of `color`
  image?: string // css gradient painted over `color` (shop bubble + primary surfaces)
  collection?: string // limited editions, grouped in their own section (see shopLayout)
  icon?: typeof GiftIcon // shop logo, when the item deserves its own visual
  featured?: boolean // shown bigger than the uniform shelf
}

export interface AccentShopItem extends BaseShopItem {
  kind: "accent"
  value: string // accent key stored in the "accent-color" setting
}

export interface ThemeShopItem extends BaseShopItem {
  kind: "theme"
  value: DecoThemeId // deco theme id stored in the "deco-theme" setting
}

export type ShopItem = AccentShopItem | ThemeShopItem

export const SHOP_ITEMS: ShopItem[] = [
  // ---- Avant-première Noël (en tête de boutique, en accès anticipé) -----
  {
    id: "accent-houx",
    kind: "accent",
    label: "Rouge houx",
    description: "Le rouge des bougies et des guirlandes de décembre.",
    price: 300,
    originalPrice: 375,
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
    price: 450,
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
    price: 600,
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
  {
    id: "accent-pain-epice",
    kind: "accent",
    label: "Pain d'épice",
    description: "Le brun doré des goûters de décembre.",
    price: 375,
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
    price: 450,
    value: "sucre-orge",
    color: "#e11d48",
    foreground: "#ffffff",
    image:
      "radial-gradient(140% 140% at 50% 35%, #e11d48 0%, #ff8fa3 55%, #ffffff 115%)",
    collection: "noel",
  },
  // ---- Exclusivité Halloween (s'arrête le lundi 9 nov, voir shopLayout) --
  {
    id: "accent-orange",
    kind: "accent",
    label: "Orange Spooky",
    description:
      "L'orange brûlé des nuits d'Halloween : potirons, bonbons, devoirs finis.",
    price: 150,
    originalPrice: 225,
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
    price: 262,
    originalPrice: 375,
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
    price: 300,
    originalPrice: 450,
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
    price: 400,
    value: "halloween2026",
    color: "#c2410c",
    foreground: "#ffffff",
    collection: "halloween",
  },
  // ---- Couleurs permanentes ---------------------------------------------
  {
    id: "accent-violet",
    kind: "accent",
    label: "Violet",
    description: "Le violet des grandes idées.",
    price: 225,
    value: "violet",
    color: "#8b5cf6",
    foreground: "#ffffff",
  },
  {
    id: "accent-teal",
    kind: "accent",
    label: "Turquoise",
    description: "L'eau claire des vacances d'été.",
    price: 225,
    value: "teal",
    color: "#0d9488",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-cobalt",
    kind: "accent",
    label: "Cobalt",
    description: "Un bleu franc, taillé pour viser haut.",
    price: 300,
    originalPrice: 375,
    value: "cobalt",
    color: "#1d4ed8",
    foreground: "#ffffff",
  },
  {
    id: "accent-pink",
    kind: "accent",
    label: "Rose",
    description: "Une couleur qui ne passe jamais inaperçue.",
    price: 450,
    value: "pink",
    color: "#db2777",
    foreground: "#ffffff",
  },
  {
    id: "accent-aurore",
    kind: "accent",
    label: "Aurore",
    description: "Un cyan électrique, comme une aurore boréale.",
    price: 750,
    value: "aurore",
    color: "#22d3ee",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-or",
    kind: "accent",
    label: "Or",
    description: "La couleur des records battus.",
    price: 1125,
    value: "or",
    color: "#ca8a04",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-menthe",
    kind: "accent",
    label: "Menthe",
    description: "Le vert frais de la rentrée, encore tout neuf.",
    price: 225,
    value: "menthe",
    color: "#34d399",
    foreground: "#1a1a1a",
  },
  {
    id: "accent-orange-clair",
    kind: "accent",
    label: "Orange",
    description: "L'orange des boîtes de crayons, bien vif.",
    price: 225,
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
    price: 225,
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
]

// The shop-bubble logo: an explicit icon when the item carries one, else the
// theme's mascot, and nothing for plain colors.
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
  if (ownedSet.has(item.id)) return { status: "owned", balance, owned }
  if (balance < item.price) return { status: "poor", balance, owned }
  return {
    status: "ok",
    balance: balance - item.price,
    owned: [...owned, item.id],
  }
}

// Owned flag of a catalog entry: a color or a theme by its id.
export function itemOwned(item: ShopItem, owned: string[]): boolean {
  return owned.includes(item.id)
}

// Active flag: a color when selected as accent, a theme when it decorates.
export function itemActive(
  item: ShopItem,
  accentColor: string,
  decoTheme: string
): boolean {
  if (item.kind === "theme") return decoTheme === item.value
  return accentColor === item.value
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
