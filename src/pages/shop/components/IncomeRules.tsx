import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { QUESTS } from "@/services/quest-rules"

// "How to earn rubies": the automatic rewards, so students know that real
// school life pays without any quest to start.
export function IncomeRules({ hideGrades }: { hideGrades: boolean }) {
  const [open, setOpen] = useState(false)
  const rules = QUESTS.filter(
    (quest) => quest.income && !(hideGrades && quest.grades)
  )

  if (rules.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold">
              Comment gagner des rubis
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {rules.length} récompenses automatiques
            </span>
          </span>
          <HugeiconsIcon
            icon={ChevronDownIcon}
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="border-t border-border/60 px-4 pt-3 text-xs text-muted-foreground">
            Ces gains tombent tout seuls : récupère-les depuis le haut de la
            boutique.
          </p>
          <ul className="mt-3 divide-y divide-border/60 border-t border-border/60">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {rule.title}
                  </div>
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
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
