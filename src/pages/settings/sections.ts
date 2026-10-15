import { Book02Icon, Settings01Icon } from "@hugeicons/core-free-icons"

export type SectionId = "general" | "subjects"

export type SectionIcon = typeof Settings01Icon

export const SECTIONS: {
  id: SectionId
  label: string
  icon: SectionIcon
}[] = [
  { id: "general", label: "Général", icon: Settings01Icon },
  { id: "subjects", label: "Matières", icon: Book02Icon },
]

export function settingsPath(section: SectionId): string {
  return section === "general" ? "/settings" : `/settings/${section}`
}

export function isSectionId(value: string | undefined): value is SectionId {
  return SECTIONS.some((section) => section.id === value)
}
