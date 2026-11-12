import { useState } from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { tapChest } from "@/features/learn/learnStore"
import { CHEST_TAPS, chestOutcome } from "@/features/learn/progress"
import { SHOP_ITEMS } from "@/features/shop/shopRules"
import { celebrate } from "@/lib/celebrate"
import { cn } from "@/lib/utils"
import { triggerHapticLight, triggerHapticMedium } from "@/services/haptics"
import { ChestArt } from "./ChestArt"
import { LearnScreen } from "./LearnScreen"

const RARITY_COLORS = [
  "text-muted-foreground",
  "text-sky-600 dark:text-sky-400",
  "text-violet-600 dark:text-violet-400",
  "text-fuchsia-600 dark:text-fuchsia-400",
  "text-amber-600 dark:text-amber-400",
]

export function ChestScreen({
  account,
  id,
  taps,
  prerequisites,
  onClose,
}: {
  account: string
  id: string
  taps: number
  prerequisites: string[]
  onClose: () => void
}) {
  const [action, setAction] = useState<{ saving: boolean; error?: string }>({
    saving: false,
  })
  const outcome = chestOutcome(account, id, taps)
  const finished = taps === CHEST_TAPS
  const item = SHOP_ITEMS.find((entry) => entry.id === outcome.itemId)

  function exit() {
    if (!action.saving) onClose()
  }

  async function tap() {
    if (action.saving) return
    if (finished) {
      onClose()
      return
    }
    setAction({ saving: true })
    triggerHapticLight()
    try {
      const updated = await tapChest(account, id, prerequisites)
      if (updated === CHEST_TAPS) {
        triggerHapticMedium()
        celebrate()
      }
      setAction({ saving: false })
    } catch {
      setAction({
        saving: false,
        error: "Impossible d’enregistrer l’appui. Réessaie.",
      })
    }
  }

  return (
    <LearnScreen title="Coffre du parcours" onExit={exit}>
      <button
        type="button"
        aria-label={finished ? "Terminer" : "Taper pour ouvrir le coffre"}
        aria-busy={action.saving}
        onClick={() => void tap()}
        className="absolute inset-0 z-10 size-full cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:ring-inset"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-4 z-20 size-11"
        onClick={exit}
        disabled={action.saving}
        aria-label="Fermer le coffre"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
      </Button>
      <div className="pointer-events-none relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex flex-col items-center gap-5 motion-safe:animate-[learn-chest-float_3s_ease-in-out_infinite]">
          <p
            aria-live="polite"
            className={cn(
              "font-heading text-3xl font-bold tracking-tight",
              RARITY_COLORS[outcome.tier]
            )}
          >
            {outcome.rarity}
          </p>
          <div
            key={taps}
            className={cn(
              taps > 0 && "motion-safe:animate-[badge-pop_240ms_ease-out]"
            )}
          >
            <ChestArt
              tier={outcome.tier}
              open={finished}
              className="text-[min(52vw,13rem)]"
            />
          </div>
        </div>
        {finished && (
          <p
            role="status"
            className="mt-1 flex items-center gap-2 font-heading text-xl font-semibold"
          >
            {!item && (
              <img src="/gem.svg" alt="" className="size-6 object-contain" />
            )}
            {item ? item.label : `+${outcome.gems} gemmes`}
          </p>
        )}
      </div>
      <div className="pointer-events-none pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-center">
        {action.error && (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {action.error}
          </p>
        )}
        {!finished && (
          <div
            aria-label={`${taps} appuis sur ${CHEST_TAPS}`}
            className="mb-3 flex justify-center gap-2"
          >
            {Array.from({ length: CHEST_TAPS }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-2 rounded-full bg-muted",
                  index < taps && "bg-current"
                )}
              />
            ))}
          </div>
        )}
        <p className="text-sm font-medium text-muted-foreground">
          {finished ? "Touche pour continuer" : "Touche l’écran pour ouvrir"}
        </p>
      </div>
    </LearnScreen>
  )
}
