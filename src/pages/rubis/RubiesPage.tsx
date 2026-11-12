import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AppToast } from "@/components/AppToast"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { EmptyState } from "@/components/EmptyState"
import { triggerHapticLight } from "@/services/haptics"
import { ShopView } from "@/pages/shop/ShopView"
import { IncomeRules } from "./components/IncomeRules"
import { QuestList } from "./components/QuestList"
import { RubisHero } from "./components/RubisHero"
import { RubisTabs, type RubisTab } from "./components/RubisTabs"
import { useRubisPage } from "./hooks/useRubisPage"
import { getSyncStatus, onSyncStatus } from "@/services/cloudSync"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"

// The rubies hub: balance, claim, quests and the shop behind one tab switch.
export function RubiesPage() {
  const page = useRubisPage()
  const [params, setParams] = useSearchParams()
  const tab: RubisTab = params.get("tab") === "boutique" ? "shop" : "quests"
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasQuests = page.groups.length > 0 || page.achieved.length > 0
  const [offline, setOffline] = useState(() => getSyncStatus().offline)
  useEffect(() => onSyncStatus(() => setOffline(getSyncStatus().offline)), [])

  // Both tabs share the scroll container: a switch always starts back at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [tab])

  const changeTab = (next: RubisTab) => {
    triggerHapticLight()
    setParams(next === "shop" ? { tab: "boutique" } : {}, { replace: true })
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <header className="shrink-0 border-b border-border">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
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
            Rubis
          </h1>
          {tab === "shop" && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1.5">
              <img
                src="/ruby.svg"
                alt=""
                aria-hidden="true"
                className="size-5"
              />
              <span className="text-sm font-medium text-card-foreground">
                <AnimatedNumber value={String(page.rubies)} />
              </span>
            </div>
          )}
        </div>

        <div className="px-4 pb-3">
          <RubisTabs
            value={tab}
            onChange={changeTab}
            className="w-full sm:max-w-sm"
            buttonClassName="flex-1 sm:py-2 sm:text-sm"
          />
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {offline ? (
          <div className="flex min-h-[60vh] items-center justify-center px-4">
            <EmptyState
              media={
                <HugeiconsIcon
                  icon={WifiDisconnected01Icon}
                  strokeWidth={2}
                  className="size-10 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              }
              title="Rubis et quêtes indisponibles hors ligne"
              description={
                <>
                  Tes rubis, tes quêtes et la boutique ne peuvent pas être
                  vérifiés tant que tu es déconnecté(e). Reconnecte-toi pour
                  voir ton solde à jour.
                </>
              }
              action={
                <button
                  type="button"
                  className="mt-4 press text-sm font-medium text-primary underline-offset-4 hover:text-primary-text"
                  onClick={() => void window.dispatchEvent(new Event("online"))}
                >
                  Se reconnecter
                </button>
              }
            />
          </div>
        ) : tab === "quests" ? (
          <>
            <RubisHero
              rubies={page.rubies}
              pending={page.pending}
              weekRubies={page.weekRubies}
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
            </div>
          </>
        ) : (
          <ShopView />
        )}
      </div>

      <AppToast
        message={page.notice?.text ?? null}
        tone={page.notice?.tone}
        onClose={page.dismissNotice}
      />
    </m.div>
  )
}
