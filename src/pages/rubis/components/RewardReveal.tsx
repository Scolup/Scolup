import { useEffect, useState } from "react"
import { m } from "motion/react"
import { Button } from "@/components/ui/button"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { SPRING_POP } from "@/lib/motion"
import { SHOP_ITEMS } from "@/features/shop/shopRules"
import { rewardsOf, type PromoReward } from "@/features/shop/promoCodes"

const COUNT_DELAY_MS = 450

function itemOf(reward: PromoReward) {
  const itemReward = rewardsOf(reward).find((entry) => entry.kind !== "rubies")
  return itemReward
    ? SHOP_ITEMS.find((item) => item.id === itemReward.itemId)
    : undefined
}

function rewardText(reward: PromoReward): string {
  if (reward.kind === "rubies") return `+${reward.amount} rubis`
  if (reward.kind === "bundle") {
    return reward.rewards.map(rewardText).join(" et ")
  }
  const label = itemOf(reward)?.label ?? ""
  if (reward.kind === "free-item") return `${label} débloqué`
  return `${label} à ${reward.price} rubis`
}

// The moment José hands the reward over: the card pops in and, for rubies, the
// amount rolls up from zero.
export function RewardReveal({
  reward,
  onDone,
  onSeeShop,
}: {
  reward: PromoReward
  onDone: () => void
  onSeeShop: () => void
}) {
  const item = itemOf(reward)
  const target = reward.kind === "rubies" ? String(reward.amount) : ""
  // A bundle is already unlocked in full: "Continuer" is enough, no shop stop.
  const settled = reward.kind === "rubies" || reward.kind === "bundle"
  const [shown, setShown] = useState("0")
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(target), COUNT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [target])

  return (
    <div className="flex flex-col gap-4">
      <m.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING_POP}
        className="flex flex-col items-center gap-3 rounded-3xl bg-primary/10 px-5 py-6 text-center"
      >
        {item ? (
          <span
            aria-hidden="true"
            className="size-14 rounded-full border border-border/60"
            style={{ background: item.image ?? item.color }}
          />
        ) : (
          <img
            src="/ruby.svg"
            alt=""
            aria-hidden="true"
            className="h-14 w-auto"
          />
        )}
        <p className="text-xl font-semibold text-foreground">
          <span className="sr-only">{rewardText(reward)}</span>
          <span aria-hidden="true">
            {reward.kind === "rubies" ? (
              <>
                +<AnimatedNumber value={shown} /> rubis
              </>
            ) : (
              rewardText(reward)
            )}
          </span>
        </p>
      </m.div>
      {settled ? (
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
