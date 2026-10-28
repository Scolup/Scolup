"use client"

import { useEffect, useState } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { HIDE_GRADE_QUESTS, refreshQuests } from "@/services/quests"
import { triggerHapticLight } from "@/services/haptics"
import { getSetting, setSetting } from "@/services/storage"

// Some students find grades stressful: this hides every quest about grades
// (and their rewards). School-life quests about homework stay.
export function HideGradeQuestsSwitch() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    void getSetting(HIDE_GRADE_QUESTS).then((stored) => {
      if (stored === true) setHidden(true)
    })
  }, [])

  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-card-foreground">
          Masquer les quêtes liées aux notes
        </span>
        <span className="text-xs text-muted-foreground">
          Les quêtes sur les devoirs restent actives
        </span>
      </div>
      <SwitchPrimitive.Root
        checked={hidden}
        onCheckedChange={(checked) => {
          setHidden(checked)
          triggerHapticLight()
          void setSetting(HIDE_GRADE_QUESTS, checked).then(refreshQuests)
        }}
        aria-label="Masquer les quêtes liées aux notes"
        className="flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-muted p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none data-checked:bg-primary"
      >
        <SwitchPrimitive.Thumb className="size-6 rounded-full bg-card shadow-sm transition-transform motion-reduce:transition-none data-checked:translate-x-5" />
      </SwitchPrimitive.Root>
    </div>
  )
}
