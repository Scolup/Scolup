import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { discountPercent, shopItemIcon } from "@/features/shop/shopRules"
import type { ShopEntry } from "../shopLayout"

export function ShopCard({
  entry,
  onSelect,
}: {
  entry: ShopEntry
  onSelect: () => void
}) {
  const { item, owned, active, featured } = entry
  const discount = discountPercent(item.price, item.originalPrice)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Voir ${item.kind === "theme" ? "le thème" : "la couleur"} ${item.label}${discount ? `, en réduction de ${discount} %` : ""}`}
      className={cn(
        "flex items-center gap-3 border bg-card text-left transition-transform duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-0",
        featured
          ? "h-32 rounded-3xl bg-rose-50 p-3.5 sm:col-span-2 lg:col-span-3 dark:bg-rose-950/20"
          : "h-19 rounded-2xl p-2.5",
        ringGlow(active)
      )}
    >
      <ShopBubble
        item={item}
        className={featured ? "size-16" : "size-12"}
        owned={owned}
        active={active}
      />
      <span className={cn("min-w-0 flex-1", featured && "flex flex-col gap-1")}>
        <span
          className={cn(
            "truncate",
            featured ? "text-lg font-bold" : "text-base font-semibold",
            "text-foreground"
          )}
        >
          {item.label}
        </span>
        {featured && (
          <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {item.description}
          </span>
        )}
      </span>
      <Price item={item} discount={discount} featured={!!featured} />
    </button>
  )
}

function ringGlow(active: boolean): string {
  return active ? "border-primary/50" : "border-border/70"
}

function SaleChip({
  discount,
  featured,
}: {
  discount: number
  featured?: boolean
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-rose-600 font-bold text-white",
        featured
          ? "px-2.5 py-1.5 text-sm"
          : "px-1.5 py-1 text-[10px] leading-none"
      )}
    >
      -{discount} %
    </span>
  )
}

// The bubble, ringed when it is the current theme; a small check sits on it
// once the item is owned. Themes keep the same round shape but carry their
// featured icon, so a theme never reads as a color.
export function ShopBubble({
  item,
  className,
  owned,
  active,
}: {
  item: ShopEntry["item"]
  className: string
  owned: boolean
  active: boolean
}) {
  // A theme wears its featured icon, a pack its gift; plain colors stay
  // bare so the shop reads at a glance: round = color, icon = something else.
  const badge = shopItemIcon(item)

  return (
    <span aria-hidden="true" className="relative shrink-0">
      <span
        style={{
          backgroundColor: item.color,
          backgroundImage: item.image,
        }}
        className={cn(
          "flex items-center justify-center rounded-full shadow-inner ring-1 ring-black/10 ring-inset",
          className,
          active && "ring-2 ring-ring"
        )}
      >
        {badge && (
          <HugeiconsIcon
            icon={badge.icon}
            style={{ color: badge.color }}
            className="size-1/2"
          />
        )}
      </span>
      {owned && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
          <HugeiconsIcon icon={Tick02Icon} className="size-2.5" />
        </span>
      )}
    </span>
  )
}

// The right cluster, pinned to the card's edge and centered on its height.
// On sale: the struck original price, then the sale price burning in rose —
// the deal has to be seen at a glance. The featured pack's cluster is one
// size up.
function Price({
  item,
  discount,
  featured = false,
}: {
  item: ShopEntry["item"]
  discount: number | null
  featured?: boolean
}) {
  if (discount && item.originalPrice) {
    return (
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <SaleChip discount={discount} featured={featured} />
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-muted-foreground tabular-nums line-through",
              featured ? "text-sm" : "text-xs"
            )}
          >
            {item.originalPrice}
          </span>
          <img
            src="/ruby.svg"
            alt=""
            aria-hidden="true"
            className={featured ? "size-5" : "size-4"}
          />
          <span
            className={cn(
              "font-bold text-rose-600 tabular-nums dark:text-rose-400",
              featured ? "text-2xl" : "text-lg"
            )}
          >
            {item.price}
          </span>
        </span>
      </span>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
      <span className="text-lg font-semibold text-foreground tabular-nums">
        {item.price}
      </span>
    </span>
  )
}
