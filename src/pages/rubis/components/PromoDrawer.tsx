import { HugeiconsIcon } from "@hugeicons/react"
import { Coupon01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { SHOP_ITEMS } from "@/features/shop/shopRules"
import type { PromoReward } from "@/features/shop/promoCodes"
import type { RedeemStatus } from "@/features/shop/shop"
import { usePromoCode } from "../hooks/usePromoCode"

// One place to redeem a code, whatever it gives: rubies, a free item or a
// lower price. The item drawer no longer carries its own promo field.
export function PromoDrawer({
  open,
  onOpenChange,
  onSeeShop,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSeeShop: () => void
}) {
  const promo = usePromoCode()
  const reward =
    promo.result && promo.result.status === "ok" ? promo.result.reward : null

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) promo.reset()
  }

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DrawerTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <HugeiconsIcon
              icon={Coupon01Icon}
              className="size-5"
              aria-hidden="true"
            />
            Un code à utiliser ?
          </DrawerTitle>

          {reward ? (
            <RewardReveal
              reward={reward}
              onDone={() => close(false)}
              onSeeShop={() => {
                promo.reset()
                onSeeShop()
              }}
            />
          ) : (
            <PromoForm promo={promo} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function PromoForm({ promo }: { promo: ReturnType<typeof usePromoCode> }) {
  const error =
    promo.result && promo.result.status !== "ok"
      ? errorText(promo.result.status)
      : ""

  return (
    <form
      className="mt-5 flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void promo.submit()
      }}
    >
      <p className="text-sm text-muted-foreground">
        Saisis ton code : des rubis, un article offert ou un prix réduit.
      </p>
      <div className="flex gap-2">
        <Input
          id="promo-code"
          aria-label="Code"
          value={promo.code}
          onChange={(event) => promo.setCode(event.target.value)}
          placeholder="Saisir un code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={128}
          aria-invalid={Boolean(error)}
          aria-describedby="promo-code-status"
          className="min-h-11 min-w-0 flex-1"
        />
        <Button
          type="submit"
          className="min-h-11"
          disabled={!promo.code.trim() || promo.busy}
        >
          Valider
        </Button>
      </div>
      <p
        id="promo-code-status"
        role="status"
        className="min-h-5 text-sm text-destructive"
      >
        {error}
      </p>
    </form>
  )
}

function RewardReveal({
  reward,
  onDone,
  onSeeShop,
}: {
  reward: PromoReward
  onDone: () => void
  onSeeShop: () => void
}) {
  const label =
    reward.kind === "rubies"
      ? ""
      : (SHOP_ITEMS.find((item) => item.id === reward.itemId)?.label ?? "")

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <HugeiconsIcon
            icon={Tick02Icon}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {rewardText(reward, label)}
          </p>
          <p className="text-xs text-muted-foreground">
            Code validé, profite bien !
          </p>
        </div>
      </div>
      {reward.kind === "rubies" ? (
        <Button onClick={onDone} className="h-11 w-full">
          Continuer
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone} className="h-11 flex-1">
            Plus tard
          </Button>
          <Button onClick={onSeeShop} className="h-11 flex-1">
            Voir dans la boutique
          </Button>
        </div>
      )}
    </div>
  )
}

function rewardText(reward: PromoReward, label: string): string {
  if (reward.kind === "rubies") return `+${reward.amount} rubis`
  if (reward.kind === "free-item") return `${label} débloqué`
  return `${label} à ${reward.price} rubis`
}

function errorText(status: RedeemStatus): string {
  if (status === "invalid") return "Ce code n’existe pas."
  if (status === "used") return "Ce code a déjà été utilisé."
  return "Impossible de valider le code pour le moment."
}
