import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ProgressRing } from "./ProgressRing"

type Goal = {
  id: string
  title: string
  description: string
  count: number
  goal: number
  reward: number
}

export function NextGoalsCard({
  quests,
  onOpen,
  icon = "/ruby.svg",
}: {
  quests: readonly Goal[]
  onOpen: () => void
  icon?: string
}) {
  if (!quests.length) return null
  return (
    <section
      aria-label="Prochains objectifs"
      className="content-in rounded-3xl border border-border/70 bg-card"
    >
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-11 w-full press-lg items-center justify-between gap-2 rounded-2xl px-3.5 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="truncate text-sm font-semibold text-card-foreground">
            {quests.length > 1 ? "Prochains objectifs" : "Prochain objectif"}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </div>
      <ul className="flex flex-col gap-1 px-4 py-2">
        {quests.map((quest) => (
          <li key={quest.id} className="flex items-center gap-3 px-3.5 py-2">
            <ProgressRing
              size={32}
              value={quest.count / quest.goal}
              label={`${quest.count} sur ${quest.goal}`}
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
              <img src={icon} alt="" className="size-4 object-contain" />
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
