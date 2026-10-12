import { m } from "motion/react"
import { cn } from "@/lib/utils"

export type ThemeColor = "yellow" | "red" | "green" | "blue"

interface ThemeOption {
  value: ThemeColor
  label: string
  className: string
}

const THEMES: ThemeOption[] = [
  { value: "yellow", label: "Jaune", className: "bg-[#e5af4b]" },
  { value: "red", label: "Rouge", className: "bg-[#dd0046]" },
  { value: "green", label: "Vert", className: "bg-[#25b256]" },
  { value: "blue", label: "Bleu", className: "bg-[#48B7E8]" },
]

function getCheckmarkColor(theme: ThemeColor): string {
  return theme === "yellow" || theme === "blue" ? "#1a1a1a" : "#ffffff"
}

function handleThemeKeydown(
  event: React.KeyboardEvent,
  currentIndex: number,
  onSelect: (color: ThemeColor) => void
) {
  const isLeftOrUp = event.key === "ArrowLeft" || event.key === "ArrowUp"
  const isRightOrDown = event.key === "ArrowRight" || event.key === "ArrowDown"
  const isConfirm = event.key === "Enter" || event.key === " "

  if (!isLeftOrUp && !isRightOrDown && !isConfirm) return

  event.preventDefault()

  if (isLeftOrUp) {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : THEMES.length - 1
    onSelect(THEMES[prevIndex].value)
  } else if (isRightOrDown) {
    const nextIndex = currentIndex < THEMES.length - 1 ? currentIndex + 1 : 0
    onSelect(THEMES[nextIndex].value)
  } else if (isConfirm) {
    onSelect(THEMES[currentIndex].value)
  }
}

interface AccentColorPickerProps {
  value: string
  label: string
  onPick: (color: ThemeColor) => void
  className?: string
}

export function AccentColorPicker({
  value,
  label,
  onPick,
  className,
}: AccentColorPickerProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("grid grid-cols-4 gap-2", className)}
    >
      {THEMES.map((theme, index) => (
        <m.button
          key={theme.value}
          type="button"
          onClick={() => onPick(theme.value)}
          onKeyDown={(e) => handleThemeKeydown(e, index, onPick)}
          aria-pressed={value === theme.value}
          aria-label={`Couleur ${theme.label}`}
          className="flex cursor-pointer flex-col items-center gap-2"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <m.div
            className={cn(
              "size-12 rounded-full",
              theme.className,
              value === theme.value && "ring-2 ring-foreground ring-offset-2"
            )}
            animate={{
              scale: value === theme.value ? [1, 1.18, 1] : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 14,
            }}
          >
            {value === theme.value && (
              <m.span
                className="flex h-full items-center justify-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                  style={{ color: getCheckmarkColor(theme.value) }}
                >
                  <m.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </svg>
              </m.span>
            )}
          </m.div>
          <span className="text-xs text-muted-foreground">{theme.label}</span>
        </m.button>
      ))}
    </div>
  )
}
