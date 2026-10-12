import {
  Book02Icon,
  Calendar02Icon,
  Mortarboard01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

export type SectionId = "general" | "profil" | "agenda" | "grades" | "subjects"

export type SectionIcon = typeof Settings01Icon

export const SECTIONS: {
  id: SectionId
  label: string
  icon: SectionIcon
}[] = [
  { id: "general", label: "Général", icon: Settings01Icon },
  { id: "profil", label: "Profil", icon: UserIcon },
  { id: "agenda", label: "Agenda", icon: Calendar02Icon },
  { id: "grades", label: "Notes", icon: Mortarboard01Icon },
  { id: "subjects", label: "Matières", icon: Book02Icon },
]

export function settingsPath(section: SectionId): string {
  return section === "general" ? "/settings" : `/settings/${section}`
}

export function isSectionId(value: string | undefined): value is SectionId {
  return SECTIONS.some((section) => section.id === value)
}
