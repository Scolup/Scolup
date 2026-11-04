import { Fragment, useEffect, useState } from "react"
import { AppToast } from "@/components/AppToast"
import { useDelayedLoading } from "@/hooks/useDelayedLoading"
import { CollectionBanner } from "./components/CollectionBanner"
import { ShopCard } from "./components/ShopCard"
import { ShopItemDrawer } from "./components/ShopItemDrawer"
import { ShopSkeleton } from "./components/ShopSkeleton"
import { useShopPage } from "./hooks/useShopPage"
import { countdownLabel, layoutShop } from "./shopLayout"

// The shop shelf, shown as the rubies hub's second tab: the header, back
// button and balance stay in the hub.
export function ShopView() {
  const page = useShopPage()
  const showSkeleton = useDelayedLoading(!page.ready)
  // A ticking clock drives the limited-edition countdowns and makes the
  // collection vanish on time without a page reload.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const { collections, colors } = layoutShop(page.items, now)

  return (
    <>
      {showSkeleton ? (
        <ShopSkeleton />
      ) : (
        <div className="flex flex-col gap-7 px-4 pt-6 pb-10">
          {collections.map((group) => (
            <Fragment key={group.id}>
              <section
                aria-labelledby={`collection-${group.id}`}
                className="flex flex-col gap-2.5"
              >
                <CollectionBanner
                  id={group.id}
                  label={group.label}
                  hint={group.hint}
                  countdown={
                    group.endsAt ? countdownLabel(now, group.endsAt) : ""
                  }
                />
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.entries.map((entry) => (
                    <ShopCard
                      key={entry.item.id}
                      entry={entry}
                      onSelect={() => page.select(entry.item)}
                    />
                  ))}
                </div>
              </section>
              {/* Fractions between the categories, stopping before the edges */}
              <span aria-hidden="true" className="mx-3 h-px bg-border/60" />
            </Fragment>
          ))}

          <section
            aria-labelledby="collection-colors"
            className="flex flex-col gap-2.5"
          >
            <CollectionBanner
              id="colors"
              label="Couleurs & thèmes"
              hint="L'épicerie des couleurs"
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {colors.map((entry) => (
                <ShopCard
                  key={entry.item.id}
                  entry={entry}
                  onSelect={() => page.select(entry.item)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      <ShopItemDrawer
        entry={page.selected}
        onOpenChange={page.deselect}
        onBuy={() => {
          if (page.selected) void page.buy(page.selected.item)
        }}
        onUse={(accentValue) => {
          if (page.selected) page.use(page.selected.item, accentValue)
        }}
      />

      <AppToast
        message={page.notice?.text ?? null}
        tone={page.notice?.tone}
        onClose={page.dismissNotice}
      />
    </>
  )
}
