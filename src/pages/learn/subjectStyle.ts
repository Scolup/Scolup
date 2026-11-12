import {
  Atom01Icon,
  BookOpen01Icon,
  Calculator01Icon,
  Globe02Icon,
  LanguageCircleIcon,
  Leaf01Icon,
} from "@hugeicons/core-free-icons"
import type { Subject } from "./curriculum"

export const SUBJECT_STYLE = {
  Mathématiques: {
    icon: Calculator01Icon,
    tint: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  Français: {
    icon: BookOpen01Icon,
    tint: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  },
  "Histoire-géographie": {
    icon: Globe02Icon,
    tint: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
  },
  SVT: {
    icon: Leaf01Icon,
    tint: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  "Physique-chimie": {
    icon: Atom01Icon,
    tint: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  },
  Anglais: {
    icon: LanguageCircleIcon,
    tint: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  },
} satisfies Record<Subject, { icon: typeof BookOpen01Icon; tint: string }>
