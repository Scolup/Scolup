import {
  Calendar02Icon,
  Comment03Icon,
  Home01Icon,
  LibraryIcon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons"

export const TABS = [
  { value: "home", path: "/", label: "Accueil", icon: Home01Icon },
  {
    value: "messages",
    path: "/messages",
    label: "Messages",
    icon: Comment03Icon,
  },
  { value: "agenda", path: "/agenda", label: "Agenda", icon: Calendar02Icon },
  { value: "homework", path: "/homework", label: "Devoirs", icon: LibraryIcon },
  { value: "grades", path: "/grades", label: "Notes", icon: Mortarboard01Icon },
]

export function tabForPath(pathname: string): string {
  return TABS.find((tab) => tab.path === pathname)?.value ?? "home"
}

export function pathForTab(value: string): string {
  return TABS.find((tab) => tab.value === value)?.path ?? "/"
}
