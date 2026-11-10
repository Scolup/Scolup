// Decoration themes sold in the shop: unlike accent colors (which only change
// `--primary`), a theme is a whole-app identity. Its hue repaints every
// surface, and Christmas alone adds its snowfall. Nothing is limited to a
// single page.
//
// ADD A THEME -> add an item with kind "theme" in SHOP_ITEMS AND a config
//                here with the same `value`.
import {
  GameController01Icon,
  GiftIcon,
  Mortarboard01Icon,
  PumpkinIcon,
  TrophyIcon,
} from "@hugeicons/core-free-icons"

export type DecoThemeId = "noel" | "jeux" | "sport" | "school" | "halloween2026"

export type DecoIcon = typeof GiftIcon

export interface DecoThemeDef {
  label: string
  // Signature hue: repaints the surfaces and the celebration burst.
  accent: string
  // The app-wide weather: soft snowflakes falling over every screen. Only
  // the Christmas theme has one; the other themes are colors and a motif.
  snow?: boolean
  // The signature icon: shop logo, preview, home hero.
  motif: DecoIcon
}

export const DECO_THEMES: Record<DecoThemeId, DecoThemeDef> = {
  noel: {
    label: "Thème Noël",
    accent: "#ef4444",
    snow: true,
    motif: GiftIcon,
  },
  jeux: {
    label: "Thème Jeux vidéo",
    accent: "#7c3aed",
    motif: GameController01Icon,
  },
  sport: {
    label: "Thème Sport",
    accent: "#ea580c",
    motif: TrophyIcon,
  },
  school: {
    label: "Thème École",
    accent: "#4f46e5",
    motif: Mortarboard01Icon,
  },
  halloween2026: {
    label: "Thème Halloween 2026",
    accent: "#c2410c",
    motif: PumpkinIcon,
  },
}

export function isDecoThemeId(value: string): value is DecoThemeId {
  return value in DECO_THEMES
}
