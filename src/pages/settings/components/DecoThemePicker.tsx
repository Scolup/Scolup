import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  shopItemIcon,
  SHOP_ITEMS,
  type ThemeShopItem,
} from "@/features/shop/shopRules"

const OWNABLE = SHOP_ITEMS.filter(
  (item): item is ThemeShopItem => item.kind === "theme"
)

interface DecoThemePickerProps {
  // Current "deco-theme" setting: a theme id, or "" for none.
  value: string
  // Shop item ids owned by the player: bought themes only show up here.
  owned: string[]
  onPick: (value: string) => void
}

export function DecoThemePicker({
  value,
  owned,
  onPick,
}: DecoThemePickerProps) {
  const navigate = useNavigate()
  const ownedThemes = OWNABLE.filter((item) => owned.includes(item.id))

  if (ownedThemes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun thème acheté pour l'instant : ils attendent à la boutique des
          rubis.
        </p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => navigate("/rubis?tab=boutique")}
        >
          Voir la boutique
        </Button>
      </div>
    )
  }

  // One flat row: the neutral choice first, then every owned theme. Tapping
  // the active theme puts the app back to neutral.
  return (
    <div className="grid grid-cols-4 items-start gap-2">
      <DecoSwatch
        label="Aucun"
        active={value === ""}
        onTap={() => onPick("")}
      />
      {ownedThemes.map((item) => (
        <DecoSwatch
          key={item.id}
          label={item.label}
          icon={shopItemIcon(item)?.icon ?? undefined}
          color={item.color}
          image={item.image}
          foreground={item.foreground}
          active={value === item.value}
          onTap={() => onPick(value === item.value ? "" : item.value)}
        />
      ))}
    </div>
  )
}

function DecoSwatch({
  label,
  icon,
  color,
  image,
  foreground,
  active,
  onTap,
}: {
  label: string
  icon?: NonNullable<ReturnType<typeof shopItemIcon>>["icon"]
  color?: string
  image?: string
  foreground?: string
  active: boolean
  onTap: () => void
}) {
  return (
    <m.button
      type="button"
      onClick={onTap}
      aria-pressed={active}
      aria-label={label}
      className="flex cursor-pointer flex-col items-center gap-2"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span
        style={
          icon
            ? {
                backgroundColor: color,
                backgroundImage: image,
                color: foreground,
              }
            : undefined
        }
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl",
          icon
            ? ""
            : "border-2 border-dashed border-border/70 text-muted-foreground",
          active && "ring-2 ring-foreground ring-offset-2"
        )}
      >
        {icon ? (
          <HugeiconsIcon icon={icon} className="size-6" />
        ) : (
          <span className="h-0.5 w-4 rounded-full bg-current opacity-70" />
        )}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {label.replace(/^Thème /, "")}
      </span>
    </m.button>
  )
}
