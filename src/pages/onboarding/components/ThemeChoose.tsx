import { cn } from "@/lib/utils"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PaintBoardIcon } from "@hugeicons/core-free-icons"
import { useState } from "react"
import { setSetting } from "@/services/storage"
import { useTheme } from "@/components/ThemeProvider"
import { useShop } from "@/features/shop/useShop"
import {
  AccentColorPicker,
  type ThemeColor,
} from "@/components/AccentColorPicker"
import { staggerContainer, fadeUp } from "@/lib/motion"
import { OnboardingConfirmButton } from "./OnboardingConfirmButton"

interface ThemeChooseProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

export function ThemeChoose({ className, onNext }: ThemeChooseProps) {
  const [selected, setSelected] = useState<ThemeColor | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const { setAccentColor } = useTheme()
  const { state } = useShop()

  const handleSelectTheme = (color: ThemeColor) => {
    setSelected(color)
    setAccentColor(color)
  }

  const handleConfirm = async () => {
    if (!selected) return
    setConfirmed(true)
    setAccentColor(selected)
    await setSetting("color", selected)
    setTimeout(() => onNext?.(), 400)
  }

  return (
    <m.div
      className={cn("flex flex-col gap-6", className)}
      variants={staggerContainer(0.1, 0.1)}
      initial="hidden"
      animate="visible"
    >
      <m.div
        variants={fadeUp()}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="flex flex-col items-center gap-2 font-medium">
          <div className="flex size-8 items-center justify-center rounded-md">
            <HugeiconsIcon
              icon={PaintBoardIcon}
              strokeWidth={2}
              className="size-6"
            />
          </div>
          <span className="sr-only">Couleur</span>
        </div>
        <h1 className="text-xl font-bold">Quelle couleur préfères-tu ?</h1>
      </m.div>

      <m.div variants={fadeUp()}>
        <AccentColorPicker
          label="Couleur d'accueil"
          value={selected ?? ""}
          owned={state.owned}
          onPick={handleSelectTheme}
        />
      </m.div>

      <OnboardingConfirmButton
        label="Celle-là !"
        confirmed={confirmed}
        disabled={!selected}
        onClick={handleConfirm}
      />
    </m.div>
  )
}
