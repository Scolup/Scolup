import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PaintBoardIcon } from "@hugeicons/core-free-icons"
import { useState } from "react"
import { setSetting } from "@/services/storage"
import { useTheme } from "@/ui/theme-provider"
import { AccentColorPicker, type ThemeColor } from "@/ui/accent-color-picker"
import { staggerContainer, fadeUp } from "@/hooks/use-micro-interactions"
interface ThemeChooseProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

export function ThemeChoose({ className, onNext }: ThemeChooseProps) {
  const [selected, setSelected] = useState<ThemeColor | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const { setAccentColor } = useTheme()

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
          onPick={handleSelectTheme}
        />
      </m.div>

      <m.div
        variants={fadeUp()}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="flex flex-col gap-3"
      >
        <Button
          type="button"
          disabled={!selected || confirmed}
          onClick={handleConfirm}
          className="relative overflow-hidden disabled:cursor-not-allowed"
        >
          {confirmed ? (
            <m.span
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              Celle-là !
            </m.span>
          ) : (
            <span className="flex items-center gap-2">Celle-là !</span>
          )}
        </Button>
      </m.div>
    </m.div>
  )
}
