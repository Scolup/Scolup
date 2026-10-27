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
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3">
      <span
        aria-hidden="true"
        style={{ backgroundColor: item.color }}
        className="size-10 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">Thème {item.label}</div>
        <div className="truncate text-xs text-muted-foreground">
          {owned
            ? active
              ? "Thème utilisé"
              : "Débloqué"
            : missing > 0
              ? `Encore ${missing} rubis`
              : "Prêt à débloquer"}
        </div>
      </div>
      {owned ? (
        <Button
          variant="outline"
          size="lg"
          disabled={active}
          onClick={onUse}
          className="shrink-0"
        >
          {active ? "Utilisée" : "Utiliser"}
        </Button>
      ) : (
        <Button
          size="lg"
          disabled={missing > 0}
          onClick={onBuy}
          className="shrink-0"
        >
          <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
          {item.price}
        </Button>
      )}
    </div>
  )
}
