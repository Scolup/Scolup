import { m } from "motion/react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

interface NavigationHeaderProps {
  onBack: () => void
}

export function OnboardingNavigationHeader({ onBack }: NavigationHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 pt-2 pb-4">
      <m.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Revenir à l'étape précédente"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
        </Button>
      </m.div>
    </div>
  )
}
