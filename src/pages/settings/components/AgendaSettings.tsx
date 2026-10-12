"use client"

import { useState } from "react"
import { getSettingSync, setSetting } from "@/services/storage"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const VIEWS = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
] as const

export function AgendaSettings() {
  const [view, setView] = useState(() =>
    getSettingSync("agendaView") === "week" ? "week" : "day"
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">Agenda</p>
      <div className="flex flex-col gap-1.5 rounded-3xl border border-border/70 bg-card px-4 py-5">
        <label
          htmlFor="settings-agenda-view"
          className="text-xs font-medium text-muted-foreground"
        >
          Vue par défaut
        </label>
        <Select
          items={VIEWS}
          value={view}
          onValueChange={(value) => {
            if (value === null) return
            setView(value)
            void setSetting("agendaView", value)
          }}
        >
          <SelectTrigger id="settings-agenda-view" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIEWS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Le bouton Jour / Semaine de l'agenda fonctionne toujours.
        </p>
      </div>
    </div>
  )
}
