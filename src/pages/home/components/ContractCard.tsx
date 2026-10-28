"use client"

import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useQuests } from "@/hooks/use-quests"
import { triggerHapticLight } from "@/services/haptics"
import { ProgressRing } from "@/ui/progress-ring"

// Home-screen advert for the quests: this week's personal contract (made from
// the student's real homework and grades), or the weekly quests until it exists.
export function ContractCard() {
  const navigate = useNavigate()
  const { quests } = useQuests()

  const contract = quests.filter((quest) => quest.generated)
  const shown = (
    contract.length > 0
      ? contract
      : quests.filter((quest) => quest.period === "weekly")
  ).slice(0, 3)
  if (shown.length === 0) return null

  const done = shown.filter((quest) => quest.state === "achieved").length

  return (
    <section
      aria-label="Contrat de la semaine"
      className="rounded-3xl border border-border/70 bg-card"
    >
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={() => {
            triggerHapticLight()
            navigate("/shop")
          }}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="truncate text-sm font-semibold text-card-foreground">
            {contract.length > 0 ? "Contrat de la semaine" : "Quêtes"}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
            {done}/{shown.length}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4"
              aria-hidden="true"
            />
          </span>
        </button>
      </div>
      <ul className="flex flex-col gap-1 px-4 py-2">
        {shown.map((quest) => (
          <li key={quest.id} className="flex items-center gap-3 px-3.5 py-2">
            <ProgressRing
              size={32}
              value={quest.state === "achieved" ? 1 : quest.count / quest.goal}
              label={
                quest.state === "achieved"
                  ? "Quête accomplie"
                  : `${quest.count} sur ${quest.goal}`
              }
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-card-foreground">
                {quest.title}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {quest.description}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <img
                src="/ruby.svg"
                alt=""
                aria-hidden="true"
                className="size-4"
              />
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                +{quest.reward}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
