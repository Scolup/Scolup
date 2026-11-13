import { HugeiconsIcon } from "@hugeicons/react"
import { Key01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { usePromoCode, type JoseSpeech } from "../hooks/usePromoCode"
import { Jose } from "./Jose"
import { RewardReveal } from "./RewardReveal"

// José's vault: type a code, then touch José. With a code he answers (a
// mystery, a "warm", or the reward); with nothing typed he whispers a hint.
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
          <DrawerTitle className="flex items-center justify-center gap-2 text-lg font-semibold text-card-foreground">
            <HugeiconsIcon
              icon={Key01Icon}
              className="size-5"
              aria-hidden="true"
            />
            Le coffre de José
          </DrawerTitle>

          <div className="mt-4 flex flex-col gap-4">
            <Bubble speech={promo.speech} />
            <Jose
              mood={promo.speech.mood}
              tick={promo.speech.tick}
              busy={promo.busy}
              onTouch={() => void promo.touchJose()}
            />
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
              <PromoField promo={promo} />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Bubble({ speech }: { speech: JoseSpeech }) {
  return (
    <div
      role="status"
      className="relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted px-4 py-3 text-center"
    >
      <p key={speech.tick} className="content-in text-sm text-foreground">
        {speech.text}
      </p>
      {speech.length ? (
        <p className="content-in text-sm tracking-[0.35em] text-muted-foreground">
          <span className="sr-only">{speech.length} caractères</span>
          <span aria-hidden="true">{"•".repeat(speech.length)}</span>
        </p>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-muted"
      />
    </div>
  )
}

function PromoField({ promo }: { promo: ReturnType<typeof usePromoCode> }) {
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void promo.touchJose()
      }}
    >
      <div
        className={cn(
          promo.shaking &&
            "animate-[shake_0.4s_var(--ease-out)] motion-reduce:animate-none"
        )}
        onAnimationEnd={promo.endShake}
      >
        <Input
          id="promo-code"
          aria-label="Code secret"
          value={promo.code}
          onChange={(event) => promo.setCode(event.target.value)}
          placeholder="Chuchote ton code…"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={128}
          className="min-h-12 text-center font-mono text-lg tracking-[0.2em] uppercase placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:normal-case"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Touche José pour valider ou avoir un indice.
      </p>
    </form>
  )
}
