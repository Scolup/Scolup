import { useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { triggerHapticLight } from "@/services/haptics"
import { discountPercent, type ShopItem } from "@/features/shop/shopRules"
import { ShopBubble } from "@/pages/shop/components/ShopCard"
import { pickShopHighlights } from "../shopHighlights"

const HIGHLIGHT_COUNT = 3

// Home teaser: three random items from the current shelves, refreshed every
// time the dashboard mounts.
export function ShopWidget() {
  const navigate = useNavigate()
  const items = useMemo(() => pickShopHighlights(HIGHLIGHT_COUNT), [])

  if (items.length === 0) return null

  const openShop = () => {
    triggerHapticLight()
    navigate("/rubis?tab=boutique")
  }

  const openItem = (id: string) => {
    triggerHapticLight()
    navigate(`/rubis?tab=boutique&item=${encodeURIComponent(id)}`)
  }

  return (
    <section
      aria-label="En ce moment dans la boutique"
      className="rounded-3xl border border-border/70 bg-card"
    >
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={openShop}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="truncate text-sm font-semibold text-card-foreground">
            En ce moment dans la boutique
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </div>

      <ul className="flex flex-col gap-1 px-4 py-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openItem(item.id)}
              className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <ShopBubble
                item={item}
                className="size-9"
                owned={false}
                active={false}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-card-foreground">
                  {item.label}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {kindLabel(item.kind)}
                </span>
              </span>
              <Price item={item} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function kindLabel(kind: ShopItem["kind"]): string {
  return kind === "theme" ? "Thème" : "Couleur"
}

function Price({ item }: { item: ShopItem }) {
  const discount = discountPercent(item.price, item.originalPrice)
  return (
    <span className="flex shrink-0 items-center gap-1">
      {discount !== null && (
        <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
          -{discount} %
        </span>
      )}
      <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
      <span
        className={
          discount !== null
            ? "text-sm font-semibold text-rose-600 tabular-nums dark:text-rose-400"
            : "text-sm font-semibold text-card-foreground tabular-nums"
        }
      >
        {item.price}
      </span>
    </span>
  )
}
