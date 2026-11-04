import {
  Book02Icon,
  Database02Icon,
  Mortarboard01Icon,
  PaintBrush02Icon,
  Settings01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

export type SectionId =
  | "general"
  | "theme"
  | "subjects"
  | "grades"
  | "data"
  | "account"

export type SectionIcon = typeof Settings01Icon

export const SECTIONS: {
  id: SectionId
  label: string
  icon: SectionIcon
}[] = [
  { id: "general", label: "Général", icon: Settings01Icon },
  { id: "theme", label: "Thème", icon: PaintBrush02Icon },
  { id: "subjects", label: "Matières", icon: Book02Icon },
  { id: "grades", label: "Notes", icon: Mortarboard01Icon },
  { id: "data", label: "Données", icon: Database02Icon },
  { id: "account", label: "Compte", icon: UserCircleIcon },
]

export function settingsPath(section: SectionId): string {
  return section === "general" ? "/settings" : `/settings/${section}`
}

export function isSectionId(value: string | undefined): value is SectionId {
  return SECTIONS.some((section) => section.id === value)
}
