"use client"

import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AppToast } from "@/ui/app-toast"
import { IncomeRules } from "./components/IncomeRules"
import { QuestList } from "./components/QuestList"
import { ShopHeader } from "./components/ShopHeader"
import { ShopItemCard } from "./components/ShopItemCard"
import { useShopPage } from "./hooks/useShopPage"

export function ShopPage() {
  const page = useShopPage()
  const hasQuests = page.groups.length > 0 || page.achieved.length > 0

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          className="size-11 shrink-0"
          onClick={page.goBack}
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-foreground">
          Boutique
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ShopHeader
          rubies={page.rubies}
          pending={page.pending}
          weekText={page.weekText}
          onClaim={() => void page.claim()}
        />

        <div className="flex flex-col gap-6 px-4 pb-10">
          {hasQuests && (
            <section
              aria-labelledby="quests-heading"
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="quests-heading" className="text-base font-semibold">
                  Quêtes
                </h2>
                {page.groups.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {page.groups.length} en cours
                  </span>
                )}
              </div>
              <QuestList groups={page.groups} achieved={page.achieved} />
            </section>
          )}

          <IncomeRules hideGrades={page.hideGrades} />

          <section
            aria-labelledby="themes-heading"
            className="flex flex-col gap-2"
          >
            <h2 id="themes-heading" className="text-base font-semibold">
              Thèmes
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {page.items.map(({ item, owned, active, missing }) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={owned}
                  active={active}
                  missing={missing}
                  onBuy={() => void page.buy(item)}
                  onUse={() => page.use(item)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      <AppToast
        message={page.notice?.text ?? null}
        tone={page.notice?.tone}
        onClose={page.dismissNotice}
      />
    </m.div>
  )
}
