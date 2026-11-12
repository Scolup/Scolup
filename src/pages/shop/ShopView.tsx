import { Fragment, useEffect, useState } from "react"
import { AppToast } from "@/components/AppToast"
import { HugeiconsIcon } from "@hugeicons/react"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"
import { EmptyState } from "@/components/EmptyState"
import { useDelayedLoading } from "@/hooks/useDelayedLoading"
import { getSyncStatus, onSyncStatus } from "@/services/cloudSync"
import { CollectionBanner } from "./components/CollectionBanner"
import { ShopCard } from "./components/ShopCard"
import { ShopItemDrawer } from "./components/ShopItemDrawer"
import { ShopSkeleton } from "./components/ShopSkeleton"
import { useShopPage } from "./hooks/useShopPage"
import { countdownLabel, layoutShop } from "./shopLayout"

// The shop shelf, shown as the rubies hub's second tab: the header, back
// button and balance stay in the hub.
export function ShopView() {
  // A ticking clock drives the limited-edition countdowns, the flash sale and
  // makes the collection vanish on time without a page reload.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const page = useShopPage(now)
  const showSkeleton = useDelayedLoading(!page.ready)
  const [offline, setOffline] = useState(() => getSyncStatus().offline)

  useEffect(() => onSyncStatus(() => setOffline(getSyncStatus().offline)), [])
  const { collections, colors } = layoutShop(page.items, now)

  return (
    <>
      {offline ? (
        <OfflineShop />
      ) : showSkeleton ? (
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
            <CollectionBanner id="colors" label="Couleurs & thèmes" />
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
        onUse={() => {
          if (page.selected) page.use(page.selected.item)
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

function OfflineShop() {
  return (
    <EmptyState
      media={
        <HugeiconsIcon
          icon={WifiDisconnected01Icon}
          strokeWidth={2}
          className="size-8 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
      }
      title="Boutique indisponible hors ligne"
      description="Tes rubis et ta boutique ne peuvent pas être vérifiés tant que tu es déconnecté(e)."
      action={
        <button
          type="button"
          className="mt-4 press text-xs font-medium text-primary underline-offset-4 hover:text-primary-text"
          onClick={() => void window.dispatchEvent(new Event("online"))}
        >
          Se reconnecter
        </button>
      }
      className="pt-10"
    />
  )
}
