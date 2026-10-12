import { HugeiconsIcon } from "@hugeicons/react"
import type { Chair02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export function QuickButton({
  icon,
  label,
  onClick,
}: {
  icon: typeof Chair02Icon
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="h-auto min-h-14 flex-1 justify-start gap-3 rounded-full px-4 py-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={1.5}
          className="size-5"
          aria-hidden="true"
        />
      </span>
      <span className="truncate font-medium">{label}</span>
    </Button>
  )
}
