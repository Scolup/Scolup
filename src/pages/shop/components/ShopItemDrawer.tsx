import { DetailRow } from "@/components/DetailRow"
import { useState, type ReactElement } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Coupon01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import {
  discountPercent,
  shopItemIcon,
  type ShopItem,
} from "@/features/shop/shopRules"
import { isDecoThemeId } from "@/features/shop/decoThemes"
import { COLLECTIONS, type ShopEntry } from "../shopLayout"
import { ThemePreview } from "./ThemePreview"
import { useShopPromo } from "../hooks/useShopPromo"

// Bottom sheet, like the other detail views. Buying keeps the sheet open:
// the footer flips from "Débloquer" to "Utiliser" as soon as the purchase
// lands. A derived `shown` entry keeps the last copy during the closing
// swipe (`entry` goes null before the sheet is gone).
export function ShopItemDrawer({
  entry,
  onOpenChange,
  onBuy,
  onUse,
}: {
  entry: ShopEntry | null
  onOpenChange: (open: boolean) => void
  onBuy: (code?: string) => void
  onUse: () => void
}) {
  const [shown, setShown] = useState<ShopEntry | null>(entry)
  if (entry && !sameEntry(entry, shown)) setShown(entry)

  const item: ShopItem | null = shown?.item ?? null
  const promo = useShopPromo(entry?.item.id)
  const price = item ? Math.min(item.price, promo.price ?? item.price) : 0
  const discounted =
    shown && item && promo.price !== null
      ? {
          ...shown,
          item: { ...item, price, originalPrice: item.price },
          missing: Math.max(0, shown.missing - (item.price - price)),
        }
      : shown
  const discount = discounted
    ? discountPercent(price, discounted.item.originalPrice)
    : null
  const badge = item ? shopItemIcon(item) : null
  const collectionLabel = item?.collection
    ? COLLECTIONS[item.collection]?.label
    : undefined

  return (
    <Drawer open={!!entry} onOpenChange={onOpenChange}>
      <DrawerContent>
        {shown && item && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-wrap items-center gap-2">
              <DrawerTitle className="text-lg font-semibold text-card-foreground">
                {item.label}
              </DrawerTitle>
              {collectionLabel && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {collectionLabel}
                </span>
              )}
            </div>

            {item.kind === "theme" && isDecoThemeId(item.value) ? (
              <div className="mt-4 flex flex-col gap-3">
                <ThemePreview id={item.value} />
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3.5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: item.color }}
                    className="flex size-9 items-center justify-center rounded-full shadow-inner ring-1 ring-black/10 ring-inset"
                  >
                    {badge && (
                      <HugeiconsIcon
                        icon={badge.icon}
                        style={{ color: badge.color }}
                        className="size-1/2"
                      />
                    )}
                  </span>
                </div>
                <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
              <span className="min-w-0 text-xs text-muted-foreground">
                {promo.price !== null && !shown.owned
                  ? "Prix avec le code promo"
                  : ownedStateLabel(shown, discount)}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {discount && (
                  <span className="text-xs text-muted-foreground tabular-nums line-through">
                    {discounted?.item.originalPrice}
                  </span>
                )}
                <span className="flex items-center gap-1 text-lg font-semibold">
                  <img
                    src="/ruby.svg"
                    alt=""
                    aria-hidden="true"
                    className="size-4"
                  />
                  {price}
                </span>
              </span>
            </div>

            {!shown.owned && (
              <div className="mt-5">
                <DetailRow
                  icon={Coupon01Icon}
                  label="Code promo"
                  value={
                    <form
                      className="mt-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        promo.apply()
                      }}
                    >
                      <div className="flex gap-2">
                        <Input
                          id="shop-promo"
                          aria-label="Code promo"
                          value={promo.code}
                          onChange={(event) =>
                            promo.setCode(event.target.value)
                          }
                          placeholder="Saisir un code"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          maxLength={128}
                          aria-invalid={Boolean(promo.error)}
                          aria-describedby="shop-promo-status"
                          className="min-h-11 min-w-0 flex-1"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="min-h-11"
                          disabled={!promo.code.trim() || promo.price !== null}
                        >
                          Appliquer
                        </Button>
                      </div>
                      <p
                        id="shop-promo-status"
                        role="status"
                        className={
                          promo.error
                            ? "mt-2 text-sm text-destructive"
                            : "mt-2 text-sm text-muted-foreground"
                        }
                      >
                        {promo.error ||
                          (promo.price !== null
                            ? `Code appliqué : ${price} rubis.`
                            : "")}
                      </p>
                    </form>
                  }
                />
              </div>
            )}
            {discounted &&
              ownedFooter(discounted, onUse, () => onBuy(promo.appliedCode))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// One entry equals another when the item and its flags match: enough to know
// whether the shown copy is fresh.
function sameEntry(a: ShopEntry, b: ShopEntry | null): boolean {
  if (!b) return false
  return (
    a.item === b.item &&
    a.owned === b.owned &&
    a.active === b.active &&
    a.missing === b.missing
  )
}

// The single footer button. Not owned: "Débloquer" (disabled with the
// missing rubies). Owned: "Utiliser" — an active color stays disabled while
// an active theme can be picked back off ("Retirer"), sending the pages back
// to normal.
function ownedFooter(
  shown: ShopEntry,
  onUse: () => void,
  onBuy: () => void
): ReactElement {
  if (!shown.owned) {
    return (
      <Button
        key="buy"
        onClick={onBuy}
        disabled={shown.missing > 0}
        className="mt-4 h-11 w-full"
      >
        {shown.missing > 0 ? (
          `Il te manque ${shown.missing} rubis`
        ) : (
          <>
            <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
            Débloquer pour {shown.item.price}
          </>
        )}
      </Button>
    )
  }

  const usedAccent = shown.active && shown.item.kind === "accent"

  return (
    <Button
      key="owned"
      variant="outline"
      disabled={usedAccent}
      onClick={onUse}
      className="mt-4 h-11 w-full animate-[badge-pop_0.28s_ease-out]"
    >
      {shown.active ? (
        usedAccent ? (
          <>
            <HugeiconsIcon
              icon={Tick02Icon}
              className="size-4"
              aria-hidden="true"
            />
            Utilisé
          </>
        ) : (
          "Retirer"
        )
      ) : (
        "Utiliser"
      )}
    </Button>
  )
}

// Left label of the price box: the state of the item, sale-aware. The
// missing rubies live on the disabled buy button itself, not here.
function ownedStateLabel(entry: ShopEntry, discount: number | null) {
  if (entry.active) {
    return entry.item.kind === "theme"
      ? "Ton thème actuel"
      : "Ta couleur actuelle"
  }
  if (entry.owned) return "Débloqué"
  if (entry.item.originalPrice && discount) {
    const occasion =
      entry.item.collection === "halloween"
        ? " d'Halloween"
        : entry.item.collection === "noel"
          ? " de Noël"
          : " soldé"
    return `Prix${occasion} : -${discount} %`
  }
  return "Prix"
}
