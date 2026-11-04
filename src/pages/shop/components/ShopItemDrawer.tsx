import { useState, type ReactElement } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import {
  discountPercent,
  packAccents,
  shopItemIcon,
  SHOP_ITEMS,
  type AccentShopItem,
  type ShopItem,
} from "@/features/shop/shopRules"
import { COLLECTIONS, type ShopEntry } from "../shopLayout"

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
  onBuy: () => void
  onUse: (accentValue?: string) => void
}) {
  const [shown, setShown] = useState<ShopEntry | null>(entry)
  if (entry && !sameEntry(entry, shown)) setShown(entry)

  const item: ShopItem | null = shown?.item ?? null
  // Multi-color packs can't pick their accent by themselves: the first tap
  // on "Utiliser" turns the footer into a color choice instead. Stored as
  // an item id so the flag can never leak to another item.
  const [pickColorFor, setPickColorFor] = useState<string | null>(null)
  const accents = item ? packAccents(item) : []
  const chooseColor = pickColorFor !== null && pickColorFor === item?.id
  const discount = item ? discountPercent(item.price, item.originalPrice) : null
  // Same shop logo as on the card (tree, garlands...), gift for the packs.
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

            <div className="mt-4 flex items-center gap-3.5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: item.color }}
                  className="flex size-9 items-center justify-center rounded-full shadow-inner ring-1 ring-black/10 ring-inset"
                >
                  {/* Same shop logo as on the card. */}
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

            {item.kind === "bundle" && (
              // The real swatches of the pack members: the buyer sees what
              // the pack contains at a glance.
              <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-border/70 px-4 py-3.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Sont présents dans ce pack
                </p>
                <ul className="flex flex-col gap-2.5">
                  {item.items.map((id) => {
                    const member = SHOP_ITEMS.find(
                      (candidate) => candidate.id === id
                    )
                    if (!member) return null
                    const memberBadge = shopItemIcon(member)
                    return (
                      <li key={member.id} className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          style={{
                            backgroundColor: member.color,
                            backgroundImage: member.image,
                          }}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full shadow-inner ring-1 ring-black/10 ring-inset"
                        >
                          {memberBadge && (
                            <HugeiconsIcon
                              icon={memberBadge.icon}
                              style={{ color: memberBadge.color }}
                              className="size-1/2"
                            />
                          )}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium text-card-foreground">
                          {member.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
              <span className="min-w-0 text-xs text-muted-foreground">
                {ownedStateLabel(shown, discount)}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {discount && (
                  <span className="text-xs text-muted-foreground tabular-nums line-through">
                    {item.originalPrice}
                  </span>
                )}
                <span className="flex items-center gap-1 text-lg font-semibold">
                  <img
                    src="/ruby.svg"
                    alt=""
                    aria-hidden="true"
                    className="size-4"
                  />
                  {item.price}
                </span>
              </span>
            </div>

            {ownedFooter(
              shown,
              onUse,
              onBuy,
              accents,
              chooseColor,
              () => item && setPickColorFor(item.id)
            )}
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

// The color choice footer of the multi-color packs: one tap on a swatch
// applies the whole pack.
function ColorChoice({
  accents,
  onUse,
}: {
  accents: AccentShopItem[]
  onUse: (accentValue?: string) => void
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">
        Quelle couleur utiliser ?
      </p>
      <ul className="flex flex-wrap gap-3">
        {accents.map((accent) => (
          <li key={accent.id}>
            <button
              type="button"
              onClick={() => onUse(accent.value)}
              aria-label={`Utiliser la couleur ${accent.label}`}
              className="flex flex-col items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                style={{
                  backgroundColor: accent.color,
                  backgroundImage: accent.image,
                }}
                className="flex size-11 items-center justify-center rounded-full shadow-inner ring-1 ring-black/10 transition-transform duration-200 ring-inset hover:-translate-y-0.5 active:translate-y-0"
              />
              <span className="max-w-14 truncate text-[11px] font-medium text-foreground">
                {accent.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The single footer button. Not owned: "Débloquer" (disabled with the
// missing rubies). Owned: "Utiliser" — a pack with several colors first
// offers the choice ("Quelle couleur utiliser ?"), an active color stays
// disabled while an active theme can be picked back off ("Retirer"), sending
// the pages back to normal.
function ownedFooter(
  shown: ShopEntry,
  onUse: (accentValue?: string) => void,
  onBuy: () => void,
  accents: AccentShopItem[],
  chooseColor: boolean,
  onChooseColor: () => void
): ReactElement {
  if (!shown.owned) {
    return (
      <Button
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

  if (chooseColor && !shown.active) {
    return <ColorChoice accents={accents} onUse={onUse} />
  }

  const usedAccent = shown.active && shown.item.kind === "accent"
  return (
    <Button
      variant="outline"
      disabled={usedAccent}
      onClick={() =>
        accents.length > 1 && !shown.active ? onChooseColor() : onUse()
      }
      className="mt-4 h-11 w-full"
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
    return entry.item.kind === "bundle" ? "Tout est activé" : "Ton thème actuel"
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
