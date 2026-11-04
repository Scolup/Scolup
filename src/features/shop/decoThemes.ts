// Decoration themes sold in the shop: unlike accent colors (which change
// `--primary`), a theme scatters themed objects on the app pages. One source
// of truth for the icon sets; the catalog items in shopRules reference these
// ids through their `value` field.
//
// ADD A THEME -> add an item with kind "theme" in SHOP_ITEMS AND a config
//                here with the same `value`.
import {
  Backpack01Icon,
  Basketball01Icon,
  BellIcon,
  CandyIcon,
  CandyCaneIcon,
  DicesIcon,
  EraserIcon,
  FootballIcon,
  GameboyIcon,
  GameController01Icon,
  GhostIcon,
  GiftIcon,
  GlobeIcon,
  Joystick01Icon,
  MaskIcon,
  Medal02Icon,
  Moon02Icon,
  Mortarboard01Icon,
  Book02Icon,
  NotebookIcon,
  PineTreeIcon,
  PokeballIcon,
  PumpkinIcon,
  RulerIcon,
  SchoolBell01Icon,
  SkullIcon,
  SnowflakeIcon,
  StarIcon,
  TrophyIcon,
  VolleyballIcon,
  WhistleIcon,
  Crown02Icon,
} from "@hugeicons/core-free-icons"

export type DecoThemeId = "noel" | "jeux" | "sport" | "school" | "halloween2026"

export interface DecoCharm {
  icon: typeof GiftIcon
  // Position + size + tint on top of the item or the card (absolute for a
  // mascot, centered for a page-bottom scatter).
  className: string
  float?: boolean
}

export interface DecoThemeDef {
  label: string
  // Characters perched on the home widgets: index 0 sits on the grades card,
  // index 1 on the homework card (like a witch on Halloween).
  mascots: DecoCharm[]
  // Objects lined up at the bottom of the decorated pages.
  scatter: DecoCharm[]
  // Charms hung on the list pages themselves: index 0 in the grades bar,
  // 1 on top of the homework page, 2 in the messages bar — so those pages
  // are decorated without scrolling to the sprinkles.
  stickers: DecoCharm[]
  // Whole-app falling snow, painted behind the content (day and night).
  snow?: boolean
  // Whole-app candy rain, same paint trick as `snow` (Halloween).
  candies?: boolean
}

export const DECO_THEMES: Record<DecoThemeId, DecoThemeDef> = {
  noel: {
    label: "Thème Noël",
    mascots: [
      {
        icon: GiftIcon,
        className:
          "-top-5 right-3 size-10 rotate-6 text-red-600 dark:text-red-400",
      },
      {
        icon: SnowflakeIcon,
        className:
          "-top-4 left-4 size-9 -rotate-12 text-sky-500 dark:text-sky-300",
      },
    ],
    scatter: [
      {
        icon: PineTreeIcon,
        className: "size-10 rotate-3 text-green-700 dark:text-green-500",
      },
      {
        icon: SnowflakeIcon,
        className: "size-7 -rotate-12 text-sky-400 dark:text-sky-300 mb-3",
        float: true,
      },
      {
        icon: CandyCaneIcon,
        className: "size-7 rotate-45 text-red-500/80 dark:text-red-400/80 mb-2",
        float: true,
      },
      {
        icon: BellIcon,
        className: "size-7 text-amber-500 dark:text-amber-400",
      },
      {
        icon: GiftIcon,
        className: "size-6 -rotate-6 text-red-600 dark:text-red-400 mb-3",
      },
      { icon: StarIcon, className: "size-5 text-amber-400 mb-2", float: true },
    ],
    stickers: [
      {
        icon: SnowflakeIcon,
        className: "size-7 -rotate-12 text-sky-500 dark:text-sky-300",
      },
      {
        icon: CandyCaneIcon,
        className: "size-7 rotate-45 text-red-500/80 dark:text-red-400/80",
      },
      {
        icon: BellIcon,
        className: "size-6 text-amber-500 dark:text-amber-400",
      },
    ],
    snow: true,
  },
  jeux: {
    label: "Thème Jeux vidéo",
    mascots: [
      {
        icon: GameController01Icon,
        className:
          "-top-5 right-3 size-10 -rotate-6 text-violet-500 dark:text-violet-400",
      },
      {
        icon: PokeballIcon,
        className:
          "-top-4 left-4 size-9 rotate-12 text-rose-500 dark:text-rose-400",
      },
    ],
    scatter: [
      {
        icon: DicesIcon,
        className: "size-9 rotate-6 text-amber-500 dark:text-amber-400",
      },
      {
        icon: GameboyIcon,
        className: "size-8 -rotate-6 text-violet-600 dark:text-violet-300 mb-2",
        float: true,
      },
      {
        icon: Joystick01Icon,
        className: "size-7 rotate-12 text-sky-600 dark:text-sky-400 mb-3",
        float: true,
      },
      {
        icon: Crown02Icon,
        className: "size-7 text-amber-500 dark:text-amber-400",
      },
    ],
    stickers: [
      {
        icon: Joystick01Icon,
        className: "size-6 rotate-12 text-sky-600 dark:text-sky-400",
      },
      {
        icon: DicesIcon,
        className: "size-8 -rotate-6 text-amber-500 dark:text-amber-400",
      },
      {
        icon: Crown02Icon,
        className: "size-6 text-amber-500 dark:text-amber-400",
      },
    ],
  },
  sport: {
    label: "Thème Sport",
    mascots: [
      {
        icon: TrophyIcon,
        className:
          "-top-5 right-3 size-10 rotate-3 text-amber-500 dark:text-amber-400",
      },
      {
        icon: Basketball01Icon,
        className:
          "-top-4 left-4 size-9 -rotate-12 text-orange-500 dark:text-orange-400",
      },
    ],
    scatter: [
      {
        icon: FootballIcon,
        className: "size-9 rotate-6 text-emerald-700 dark:text-emerald-400",
      },
      {
        icon: Medal02Icon,
        className: "size-8 -rotate-6 text-rose-500 dark:text-rose-400 mb-2",
        float: true,
      },
      {
        icon: WhistleIcon,
        className: "size-7 rotate-12 text-sky-600 dark:text-sky-400 mb-3",
        float: true,
      },
      {
        icon: VolleyballIcon,
        className: "size-7 text-amber-600 dark:text-amber-400",
      },
    ],
    stickers: [
      {
        icon: WhistleIcon,
        className: "size-6 rotate-12 text-sky-600 dark:text-sky-400",
      },
      {
        icon: VolleyballIcon,
        className: "size-8 -rotate-6 text-amber-600 dark:text-amber-400",
      },
      {
        icon: Medal02Icon,
        className: "size-7 -rotate-12 text-rose-500 dark:text-rose-400",
      },
    ],
  },
  school: {
    label: "Thème École",
    mascots: [
      {
        icon: Mortarboard01Icon,
        className:
          "-top-5 right-3 size-10 rotate-3 text-indigo-600 dark:text-indigo-400",
      },
      {
        icon: Book02Icon,
        className:
          "-top-4 left-4 size-9 -rotate-6 text-sky-600 dark:text-sky-400",
      },
    ],
    scatter: [
      {
        icon: RulerIcon,
        className: "size-9 rotate-6 text-indigo-600 dark:text-indigo-400",
      },
      {
        icon: NotebookIcon,
        className: "size-8 -rotate-6 text-amber-600 dark:text-amber-400 mb-2",
        float: true,
      },
      {
        icon: Backpack01Icon,
        className: "size-8 rotate-3 text-rose-600 dark:text-rose-400 mb-3",
      },
      {
        icon: GlobeIcon,
        className: "size-7 rotate-12 text-sky-600 dark:text-sky-400",
        float: true,
      },
    ],
    stickers: [
      {
        icon: EraserIcon,
        className: "size-6 -rotate-12 text-indigo-500 dark:text-indigo-400",
      },
      {
        icon: RulerIcon,
        className: "size-7 -rotate-12 text-amber-600 dark:text-amber-400",
      },
      {
        icon: SchoolBell01Icon,
        className: "size-6 text-amber-500 dark:text-amber-400",
      },
    ],
  },
  halloween2026: {
    label: "Thème Halloween 2026",
    mascots: [
      {
        icon: PumpkinIcon,
        className:
          "-top-5 right-3 size-10 rotate-3 text-orange-600 dark:text-orange-400",
      },
      {
        icon: GhostIcon,
        className:
          "-top-4 left-4 size-9 -rotate-6 text-slate-500 dark:text-slate-300",
      },
    ],
    scatter: [
      {
        icon: SkullIcon,
        className: "size-9 rotate-6 text-orange-600 dark:text-orange-400",
      },
      {
        icon: CandyIcon,
        className: "size-8 -rotate-6 text-rose-600 dark:text-rose-300 mb-2",
        float: true,
      },
      {
        icon: MaskIcon,
        className: "size-8 rotate-3 text-violet-600 dark:text-violet-400 mb-3",
      },
      {
        icon: Moon02Icon,
        className: "size-7 rotate-12 text-amber-500 dark:text-amber-400",
        float: true,
      },
    ],
    stickers: [
      {
        icon: CandyIcon,
        className: "size-6 rotate-12 text-rose-500 dark:text-rose-300",
      },
      {
        icon: SkullIcon,
        className: "size-7 -rotate-6 text-slate-500 dark:text-slate-300",
      },
      {
        icon: Moon02Icon,
        className: "size-6 text-amber-500 dark:text-amber-400",
      },
    ],
    candies: true,
  },
}

export function isDecoThemeId(value: string): value is DecoThemeId {
  return value in DECO_THEMES
}
