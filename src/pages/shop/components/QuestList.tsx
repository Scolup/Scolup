import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ProgressRing } from "@/ui/progress-ring"
import type { QuestItem } from "@/hooks/use-quests"
import type { QuestGroup } from "../helpers"

export function QuestList({
  groups,
  achieved,
}: {
  groups: QuestGroup[]
  achieved: QuestItem[]
}) {
  if (groups.length === 0 && achieved.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      {groups.length > 0 && (
        <ul className="divide-y divide-border/60">
          {groups.map(({ quest, tier, tiers }) => (
            <li key={quest.id}>
              <QuestRow
                quest={quest}
                tier={tiers > 1 ? tier : undefined}
                tiers={tiers}
              />
            </li>
          ))}
        </ul>
      )}
      {achieved.length > 0 && (
        <AchievedQuests quests={achieved} divided={groups.length > 0} />
      )}
    </div>
  )
}

function QuestRow({
  quest,
  tier,
  tiers,
}: {
  quest: QuestItem
  tier?: number
  tiers?: number
}) {
  const achieved = quest.state === "achieved"

  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <ProgressRing
        size={36}
        value={achieved ? 1 : quest.count / quest.goal}
        label={
          achieved ? "Quête accomplie" : `${quest.count} sur ${quest.goal}`
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{quest.title}</span>
          {tier !== undefined && tiers !== undefined && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Palier {tier}/{tiers}
            </span>
          )}
        </div>
        {!achieved && (
          <div className="truncate text-xs text-muted-foreground">
            {quest.description}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <img
          src="/ruby.svg"
          alt=""
          aria-hidden="true"
          className={cn("size-4", !achieved && "grayscale")}
        />
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            !achieved && "text-muted-foreground"
          )}
        >
          +{quest.reward}
        </span>
      </div>
    </div>
  )
}

function AchievedQuests({
  quests,
  divided,
}: {
  quests: QuestItem[]
  divided: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
          divided && "border-t border-border/60"
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {quests.length} quête{quests.length > 1 ? "s" : ""} accomplie
          {quests.length > 1 ? "s" : ""}
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
        <ul className="divide-y divide-border/60 border-t border-border/60">
          {quests.map((quest) => (
            <li key={quest.id}>
              <QuestRow quest={quest} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
