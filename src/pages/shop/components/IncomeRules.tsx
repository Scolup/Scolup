import { QUESTS } from "@/services/quest-rules"

// "How to earn rubies": the automatic rewards, so students know that real
// school life pays without any quest to start.
export function IncomeRules({ hideGrades }: { hideGrades: boolean }) {
  const rules = QUESTS.filter(
    (quest) => quest.income && !(hideGrades && quest.grades)
  )

  return (
    <div className="flex flex-col gap-2 px-4 pb-6">
      <h2 className="text-base font-semibold">Comment gagner des rubis</h2>
      <p className="text-xs text-muted-foreground">
        Ces récompenses tombent toutes seules, sans quête à lancer.
      </p>
      <div className="flex flex-col gap-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{rule.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {rule.description}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <img
                src="/ruby.svg"
                alt=""
                aria-hidden="true"
                className="size-4"
              />
              <span className="text-sm font-medium tabular-nums">
                +{rule.reward}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
