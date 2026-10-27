import { cn } from "@/lib/utils"
import { ProgressRing } from "@/ui/progress-ring"
import type { QuestItem } from "@/hooks/use-quests"

export function QuestCard({ quest }: { quest: QuestItem }) {
  const secret = quest.state === "secret"
  const achieved = quest.state === "achieved"

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        secret
          ? "border-dashed border-border/60 bg-muted/30 opacity-60"
          : "border-border/70 bg-card",
        achieved && "opacity-80"
      )}
      aria-label={secret ? "Quête secrète" : quest.title}
    >
      <ProgressRing
        size={40}
        value={achieved ? 1 : quest.count / quest.goal}
        label={
          achieved ? "Quête accomplie" : `${quest.count} sur ${quest.goal}`
        }
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {secret ? "???" : quest.title}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {secret ? "À découvrir" : quest.description}
          {!secret && !achieved && quest.goal > 1 && (
            <span className="tabular-nums">
              {" "}
              · {quest.count}/{quest.goal}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <img
          src="/ruby.svg"
          alt=""
          aria-hidden="true"
          className={cn("size-4", !achieved && "grayscale")}
        />
        <span className="text-sm font-medium tabular-nums">
          +{quest.reward}
        </span>
      </div>
    </div>
  )
}
