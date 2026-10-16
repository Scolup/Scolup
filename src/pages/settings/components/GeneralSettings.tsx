"use client"

import { useEffect, useState } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { AccentColorPicker } from "@/ui/accent-color-picker"
import { useTheme } from "@/ui/theme-provider"
import { getSetting, setSetting } from "@/services/storage"
import { triggerHapticLight } from "@/services/haptics"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const THEME_OPTIONS = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
] as const

export function GeneralSettings() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const [haptics, setHaptics] = useState(true)

  useEffect(() => {
    void getSetting("haptics").then((stored) => {
      if (stored === false) setHaptics(false)
    })
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="px-1 text-sm text-muted-foreground">Apparence</p>
        <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card px-4 py-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-theme"
              className="text-xs font-medium text-muted-foreground"
            >
              Thème
            </label>
            <Select
              items={THEME_OPTIONS}
              value={theme}
              onValueChange={(value) => {
                if (value === null) return
                if (value !== theme) triggerHapticLight()
                setTheme(value)
              }}
            >
              <SelectTrigger id="settings-theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <AccentColorPicker
            label="Couleur de l'application"
            value={accentColor}
            onPick={(color) => {
              if (color !== accentColor) triggerHapticLight()
              setAccentColor(color)
            }}
          />
          <div className="flex min-h-11 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-card-foreground">
                Vibrations
              </span>
              <span className="text-xs text-muted-foreground">
                Petite vibration lors des actions (coche, navigation)
              </span>
            </div>
            <SwitchPrimitive.Root
              checked={haptics}
              onCheckedChange={(checked) => {
                setHaptics(checked)
                void setSetting("haptics", checked)
                if (checked) triggerHapticLight()
              }}
              aria-label="Vibrations"
              className="flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-muted p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none data-checked:bg-primary"
            >
              <SwitchPrimitive.Thumb className="size-6 rounded-full bg-card shadow-sm transition-transform motion-reduce:transition-none data-checked:translate-x-5" />
            </SwitchPrimitive.Root>
          </div>
        </div>
      </div>
    </div>
  )
}
