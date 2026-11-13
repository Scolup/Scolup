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

export type DecoThemeId =
  | "noel"
  | "jeux"
  | "sport"
  | "school"
  | "halloween2026"
  | "evomoyenne"

export type DecoIcon = typeof GiftIcon

// The Scolup logo, redrawn for the 24x24 Hugeicons viewBox: the theme signs
// itself with the app's own mark.
export const SCOLUP_LOGO_TRANSFORM = "scale(0.0116636) translate(28.85 42.85)"
export const SCOLUP_LOGO_PATH =
  "M718.899,336.852C715.83,319.979 714.286,302.864 714.286,285.714C714.286,128.024 842.31,0 1000,0C1157.69,0 1285.714,128.024 1285.714,285.714C1285.714,302.864 1284.17,319.979 1281.101,336.852L1232.052,606.471C1228.726,624.754 1236.171,643.325 1251.204,654.247C1266.238,665.17 1286.2,666.511 1302.56,657.698L1543.827,527.733C1558.925,519.6 1574.725,512.843 1591.036,507.543C1741.008,458.814 1902.328,541.011 1951.057,690.983C1999.785,840.955 1917.589,1002.275 1767.617,1051.004C1751.306,1056.304 1734.552,1060.124 1717.556,1062.419L1445.976,1099.087C1427.561,1101.574 1412.199,1114.393 1406.457,1132.066C1400.715,1149.739 1405.608,1169.139 1419.044,1181.975L1617.204,1371.271C1629.605,1383.118 1640.914,1396.056 1650.994,1409.931C1743.682,1537.505 1715.359,1716.329 1587.785,1809.017C1460.211,1901.705 1281.387,1873.382 1188.699,1745.808C1178.619,1731.934 1169.808,1717.18 1162.374,1701.725L1043.576,1454.768C1035.521,1438.023 1018.582,1427.374 1000,1427.374C981.418,1427.374 964.479,1438.023 956.424,1454.768L837.626,1701.725C830.192,1717.18 821.381,1731.934 811.301,1745.808C718.613,1873.382 539.789,1901.705 412.215,1809.017C284.641,1716.329 256.318,1537.505 349.006,1409.931C359.086,1396.056 370.395,1383.118 382.796,1371.271L580.956,1181.975C594.392,1169.139 599.285,1149.739 593.543,1132.066C587.801,1114.393 572.439,1101.574 554.024,1099.087L282.444,1062.419C265.448,1060.124 248.694,1056.304 232.383,1051.004C82.411,1002.275 0.215,840.955 48.943,690.983C97.672,541.011 258.992,458.814 408.964,507.543C425.275,512.843 441.075,519.6 456.173,527.733L697.44,657.698C713.8,666.511 733.762,665.17 748.796,654.247C763.829,643.325 771.274,624.754 767.948,606.471L718.899,336.852Z"

const ScolupIcon: DecoIcon = [
  [
    "path",
    {
      transform: SCOLUP_LOGO_TRANSFORM,
      fill: "currentColor",
      d: SCOLUP_LOGO_PATH,
    },
  ],
]

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
  evomoyenne: {
    label: "Thème Evomoyenne",
    accent: "#0284c7",
    motif: ScolupIcon,
  },
}

export function isDecoThemeId(value: string): value is DecoThemeId {
  return value in DECO_THEMES
}
