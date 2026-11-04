import { HugeiconsIcon } from "@hugeicons/react"
import type { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const tones = {
  warning: "border-destructive/30 bg-destructive/[0.06]",
  success: "border-emerald-500/30 bg-emerald-500/[0.07]",
}

const iconTones = {
  warning: "bg-destructive/10 text-destructive",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

const titleTones = {
  warning: "text-destructive",
  success: "text-emerald-700 dark:text-emerald-300",
}

export function Notice({
  tone,
  icon,
  title,
  body,
}: {
  tone: "warning" | "success"
  icon: typeof AlertCircleIcon
  title: string
  body: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl border px-4 py-3.5",
        tones[tone]
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          iconTones[tone]
        )}
      >
        <HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-sm font-semibold", titleTones[tone])}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{body}</span>
      </div>
    </div>
  )
}
