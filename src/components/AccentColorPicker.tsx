import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { SHOP_ITEMS, type AccentShopItem } from "@/features/shop/shopRules"

export type ThemeColor =
  | "yellow"
  | "red"
  | "green"
  | "blue"
  | "violet"
  | "pink"
  | "orange"
  | "teal"
  | "cobalt"
  | "aurore"
  | "or"
  | "pain-epice"
  | "sucre-orge"
  | "menthe"
  | "orange-clair"
  | "bordeaux"
  | "sorciere"
  | "fantome"
  | "houx"
  | "sapin"
  | "neige"

interface ThemeOption {
  value: ThemeColor
  label: string
  color: string
  foreground: string
  image?: string // css gradient painted over the color
  itemId?: string // set for colors bought in the shop
}

const FREE_THEMES: ThemeOption[] = [
  { value: "yellow", label: "Jaune", color: "#e5af4b", foreground: "#1a1a1a" },
  { value: "red", label: "Rouge", color: "#dd0046", foreground: "#ffffff" },
  { value: "green", label: "Vert", color: "#25b256", foreground: "#ffffff" },
  { value: "blue", label: "Bleu", color: "#48B7E8", foreground: "#1a1a1a" },
]

// Colors sold in the shop come from the shop catalog: one source of truth.
const SHOP_THEMES: ThemeOption[] = SHOP_ITEMS.filter(
  (item): item is AccentShopItem => item.kind === "accent"
).map((item) => ({
  value: item.value as ThemeColor,
  label: item.label,
  color: item.color,
  foreground: item.foreground,
  image: item.image,
  itemId: item.id,
}))

function handleThemeKeydown(
  event: React.KeyboardEvent,
  themes: ThemeOption[],
  currentIndex: number,
  onSelect: (color: ThemeColor) => void
) {
  const isLeftOrUp = event.key === "ArrowLeft" || event.key === "ArrowUp"
  const isRightOrDown = event.key === "ArrowRight" || event.key === "ArrowDown"
  const isConfirm = event.key === "Enter" || event.key === " "

  if (!isLeftOrUp && !isRightOrDown && !isConfirm) return

  event.preventDefault()

  if (isLeftOrUp) {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : themes.length - 1
    onSelect(themes[prevIndex].value)
  } else if (isRightOrDown) {
    const nextIndex = currentIndex < themes.length - 1 ? currentIndex + 1 : 0
    onSelect(themes[nextIndex].value)
  } else if (isConfirm) {
    onSelect(themes[currentIndex].value)
  }
}

interface AccentColorPickerProps {
  value: string
  label: string
  onPick: (color: ThemeColor) => void
  // Ids of the shop items the player owns. Bought colors only show up here.
  owned?: string[]
  className?: string
}

export function AccentColorPicker({
  value,
  label,
  onPick,
  owned = [],
  className,
}: AccentColorPickerProps) {
  const ownedThemes = SHOP_THEMES.filter(
    (theme) => theme.itemId && owned.includes(theme.itemId)
  )
  const themes = [...FREE_THEMES, ...ownedThemes]

  // One flat list for keyboard order (free colors, then the bought ones), two
  // visual groups: the free choice row, then the bought colors below — only
  // once at least one color was bought.
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="grid grid-cols-4 gap-2">
        {FREE_THEMES.map((theme, index) => (
          <ThemeSwatch
            key={theme.value}
            theme={theme}
            value={value}
            index={index}
            themes={themes}
            onPick={onPick}
          />
        ))}
      </div>

      {ownedThemes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Couleurs achetées
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ownedThemes.map((theme, index) => (
              <ThemeSwatch
                key={theme.value}
                theme={theme}
                value={value}
                index={FREE_THEMES.length + index}
                themes={themes}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeSwatch({
  theme,
  value,
  index,
  themes,
  onPick,
}: {
  theme: ThemeOption
  value: string
  index: number
  themes: ThemeOption[]
  onPick: (color: ThemeColor) => void
}) {
  return (
    <m.button
      type="button"
      onClick={() => onPick(theme.value)}
      onKeyDown={(e) => handleThemeKeydown(e, themes, index, onPick)}
      aria-pressed={value === theme.value}
      aria-label={`Couleur ${theme.label}`}
      className="flex cursor-pointer flex-col items-center gap-2"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <m.div
        style={{
          backgroundColor: theme.color,
          backgroundImage: theme.image,
        }}
        className={cn(
          "size-12 rounded-full",
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
              style={{ color: theme.foreground }}
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
  )
}
