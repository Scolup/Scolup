import { useEffect, useState } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { useTheme } from "@/components/ThemeProvider"
import { getSetting, setSetting } from "@/services/storage"
import { track } from "@/features/quests/service"
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
  const { theme, setTheme } = useTheme()
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
              htmlFor="settings-mode"
              className="text-xs font-medium text-muted-foreground"
            >
              Mode
            </label>
            <Select
              items={THEME_OPTIONS}
              value={theme}
              onValueChange={(value) => {
                if (value === null) return
                if (value !== theme) {
                  triggerHapticLight()
                  void track("setting-changed")
                }
                setTheme(value)
              }}
            >
              <SelectTrigger id="settings-mode" className="w-full">
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
                void track("setting-changed")
                if (checked) triggerHapticLight()
              }}
              aria-label="Vibrations"
              className="flex h-7 w-12 shrink-0 press-sm cursor-pointer items-center rounded-full bg-muted p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none data-checked:bg-primary"
            >
              <SwitchPrimitive.Thumb className="size-6 rounded-full bg-card shadow-sm transition-transform duration-200 ease-(--ease-spring) motion-reduce:transition-none data-checked:translate-x-5" />
            </SwitchPrimitive.Root>
          </div>
        </div>
      </div>
    </div>
  )
}
