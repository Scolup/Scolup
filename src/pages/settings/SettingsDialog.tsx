import type { ComponentType } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SECTIONS, type SectionId } from "./sections"
import { AgendaSettings } from "./components/AgendaSettings"
import { GeneralSettings } from "./components/GeneralSettings"
import { GradesSettings } from "./components/GradesSettings"
import { ProfileSettings } from "./components/ProfileSettings"
import { SettingsNav } from "./components/SettingsNav"
import { SubjectsSettings } from "./components/SubjectsSettings"

export type { SectionId }

const VIEWS: Record<SectionId, ComponentType> = {
  profil: ProfileSettings,
  general: GeneralSettings,
  subjects: SubjectsSettings,
  agenda: AgendaSettings,
  grades: GradesSettings,
}

export function SettingsDialog({
  open,
  onOpenChange,
  active,
  onActiveChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  active: SectionId
  onActiveChange: (section: SectionId) => void
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  const section = SECTIONS.find((entry) => entry.id === active) ?? SECTIONS[0]
  const View = VIEWS[section.id]

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          initialFocus={false}
          className="flex flex-col gap-0 overflow-hidden p-0 sm:h-[min(85dvh,540px)] sm:max-w-xl"
        >
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 gap-5 px-6 py-5">
            <SettingsNav
              active={active}
              onActiveChange={onActiveChange}
              className="flex w-40 shrink-0 flex-col gap-1 border-r border-border/50 pr-5"
              itemClassName="h-9 w-full justify-start px-2.5"
            />
            <div className="min-w-0 flex-1 overflow-y-auto">
              <View />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        initialFocus={false}
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>

        <SettingsNav
          active={active}
          onActiveChange={onActiveChange}
          className="flex shrink-0 flex-wrap gap-1.5 px-5 pt-4 pb-1"
          itemClassName="shrink-0 rounded-full px-3.5"
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-6">
          <View />
        </div>
      </DialogContent>
    </Dialog>
  )
}
