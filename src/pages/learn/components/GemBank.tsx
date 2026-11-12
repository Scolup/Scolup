import { useState } from "react"
import { useSearchParams } from "react-router"
import {
  ArrowLeftIcon,
  Exchange01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AppToast } from "@/components/AppToast"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { Button } from "@/components/ui/button"
import { claimGemQuests, exchangeGems } from "@/features/learn/learnStore"
import {
  gemBalance,
  gemQuests,
  gemsEarnedInWeek,
  GEMS_PER_RUBY,
} from "@/features/learn/progress"
import type { LearnProgress } from "@/features/learn/progress"
import { weekKey } from "@/features/quests/period"
import { celebrate } from "@/lib/celebrate"
import { QuestList } from "@/pages/rubis/components/QuestList"
import { RubisHero } from "@/pages/rubis/components/RubisHero"
import { RubisTabs, type RubisTab } from "@/pages/rubis/components/RubisTabs"
import { triggerHapticLight, triggerHapticMedium } from "@/services/haptics"

export function GemBank({
  account,
  progress,
  onBack,
}: {
  account: string
  progress: LearnProgress
  onBack: () => void
}) {
  const [params, setParams] = useSearchParams()
  const [action, setAction] = useState<{
    saving: boolean
    message: string | null
    tone: "success" | "error"
  }>({
    saving: false,
    message: null,
    tone: "success",
  })
  const [requested, setRequested] = useState(1)
  const balance = gemBalance(progress, account)
  const max = Math.floor(balance / GEMS_PER_RUBY)
  const quantity = Math.max(1, Math.min(requested, max))
  const tab: RubisTab = params.get("tab") === "boutique" ? "shop" : "quests"
  const quests = gemQuests(progress)
  const achieved = quests.filter(({ state }) => state === "achieved")
  const groups = quests
    .filter(({ state }) => state === "unachieved")
    .map((quest) => ({ quest, tier: 1, tiers: 1 }))
  const pending = achieved.reduce(
    (sum, quest) => sum + (quest.claimed ? 0 : quest.reward),
    0
  )
  const week = gemsEarnedInWeek(progress, account, weekKey(new Date()))

  function changeTab(next: RubisTab) {
    triggerHapticLight()
    const query = new URLSearchParams(params)
    if (next === "shop") query.set("tab", "boutique")
    else query.delete("tab")
    setParams(query, { replace: true })
  }

  async function submit(convert: boolean) {
    if (action.saving) return
    setAction({ saving: true, message: null, tone: "success" })
    try {
      const gained = convert
        ? (await exchangeGems(account, quantity))
          ? quantity
          : 0
        : await claimGemQuests(account)
      if (gained) {
        triggerHapticMedium()
        celebrate()
        if (convert) setRequested(1)
        setAction({
          saving: false,
          message: convert
            ? `${gained * GEMS_PER_RUBY} gemmes échangées contre ${gained} rubis.`
            : `+${gained} gemmes`,
          tone: "success",
        })
      } else {
        setAction({
          saving: false,
          message: convert
            ? "Solde de gemmes insuffisant."
            : "Tu as déjà récupéré ces gemmes.",
          tone: "error",
        })
      }
    } catch {
      setAction({
        saving: false,
        message: "Impossible d’enregistrer l’opération. Réessaie.",
        tone: "error",
      })
    }
  }

  return (
    <section className="fixed inset-0 z-[70] flex flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="shrink-0 border-b border-border">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            onClick={onBack}
            aria-label="Retour"
          >
            <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
          </Button>
          <h1 className="text-base font-semibold">Gemmes</h1>
          {tab === "shop" && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1.5 text-sm font-medium">
              <img src="/gem.svg" alt="" className="size-5 object-contain" />
              <AnimatedNumber value={String(balance)} />
              <span className="sr-only"> gemmes</span>
            </span>
          )}
        </div>
        <div className="px-4 pb-3">
          <RubisTabs
            value={tab}
            onChange={changeTab}
            className="w-full sm:max-w-sm"
            buttonClassName="min-h-11 flex-1 sm:text-sm"
          />
        </div>
      </header>
      <div
        key={tab}
        className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
      >
        {tab === "quests" ? (
          <>
            <RubisHero
              rubies={balance}
              pending={action.saving ? 0 : pending}
              weekRubies={week}
              icon="/gem.svg"
              onClaim={() => void submit(false)}
            />
            <section className="flex flex-col gap-2 px-4 pb-10">
              <h2 className="text-base font-semibold">Quêtes</h2>
              <QuestList groups={groups} achieved={achieved} icon="/gem.svg" />
            </section>
          </>
        ) : (
          <div className="mx-auto max-w-lg p-4">
            <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-success-foreground">
                  <HugeiconsIcon
                    icon={Exchange01Icon}
                    className="size-6"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h2 className="text-base font-semibold">
                    Convertir en rubis
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {GEMS_PER_RUBY} gemmes = 1 rubis
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Solde · {balance} gemmes
              </p>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted p-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Retirer un rubis"
                  disabled={quantity <= 1 || action.saving}
                  onClick={() => setRequested(quantity - 1)}
                >
                  <HugeiconsIcon icon={MinusSignIcon} />
                </Button>
                <span
                  aria-live="polite"
                  className="flex items-center gap-1.5 text-sm font-medium tabular-nums"
                >
                  <img
                    src="/gem.svg"
                    alt=""
                    className="size-4 object-contain"
                  />
                  {quantity * GEMS_PER_RUBY}
                  <span className="sr-only"> gemmes</span>
                  <span aria-hidden="true">→</span>
                  <img src="/ruby.svg" alt="" className="size-4" />
                  {quantity}
                  <span className="sr-only"> rubis</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Ajouter un rubis"
                  disabled={quantity >= max || action.saving}
                  onClick={() => setRequested(quantity + 1)}
                >
                  <HugeiconsIcon icon={PlusSignIcon} />
                </Button>
              </div>
              <Button
                className="min-h-11"
                disabled={max < 1 || action.saving}
                onClick={() => void submit(true)}
              >
                {max < 1
                  ? "Gemmes insuffisantes"
                  : `Convertir en ${quantity} rubis`}
              </Button>
            </section>
          </div>
        )}
      </div>
      <AppToast
        message={action.message}
        tone={action.tone}
        onClose={() => setAction((current) => ({ ...current, message: null }))}
      />
    </section>
  )
}
