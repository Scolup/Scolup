import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { ShopItem } from "@/services/shop-rules"

export function ShopItemCard({
  item,
  owned,
  active,
  missing,
  onBuy,
  onUse,
}: {
  item: ShopItem
  owned: boolean
  active: boolean
  missing: number // rubies still missing (0 = affordable)
  onBuy: () => void
  onUse: () => void
}) {
  const status = active
    ? "Ton thème actuel"
    : owned
      ? "Débloqué"
      : missing > 0
        ? `Encore ${missing} rubis`
        : "Prêt à débloquer"

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          style={{ backgroundColor: item.color }}
          className="size-8 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.label}</div>
          <div className="truncate text-xs text-muted-foreground">{status}</div>
        </div>
      </div>

      {owned ? (
        <Button
          variant="outline"
          disabled={active}
          onClick={onUse}
          aria-label={
            active
              ? `${item.label} est déjà utilisé`
              : `Utiliser le thème ${item.label}`
          }
          className="h-11 w-full"
        >
          {active && (
            <HugeiconsIcon
              icon={Tick02Icon}
              className="size-4"
              aria-hidden="true"
            />
          )}
          {active ? "Utilisé" : "Utiliser"}
        </Button>
      ) : (
        <Button
          disabled={missing > 0}
          onClick={onBuy}
          aria-label={`Débloquer le thème ${item.label} pour ${item.price} rubis`}
          className="h-11 w-full"
        >
          <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
          {item.price}
        </Button>
      )}
    </div>
  )
}
