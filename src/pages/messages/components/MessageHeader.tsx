import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  Cancel01Icon,
  LoaderCircleIcon,
  MailOpen01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import { avatarTint, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatFullDate, recipientsLabel, type Message } from "../helpers"

export function MessageHeader({
  message,
  placeholder,
  onClose,
  closeIcon = "back",
  refreshing,
  onMarkUnread,
  onReply,
}: {
  message: Message
  placeholder: boolean
  onClose?: () => void
  closeIcon?: "back" | "close"
  refreshing?: boolean
  onMarkUnread?: () => void
  onReply?: () => void
}) {
  const recipientsLine = recipientsLabel(message)
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fermer"
          className="shrink-0"
          onClick={onClose}
        >
          <HugeiconsIcon
            icon={closeIcon === "close" ? Cancel01Icon : ArrowLeftIcon}
            className="size-5"
          />
        </Button>
      )}

      {placeholder ? (
        <>
          <Skeleton
            className="size-10 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <div
            className="flex min-w-0 flex-1 flex-col gap-1.5"
            aria-hidden="true"
          >
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold",
              avatarTint(message.sender || message.initials || "?")
            )}
          >
            {message.initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {message.sender}
            </span>
            {recipientsLine && (
              <span
                className="truncate text-xs text-muted-foreground"
                title={recipientsLine}
              >
                {recipientsLine}
              </span>
            )}
            {message.time && (
              <span className="text-xs text-muted-foreground">
                {formatFullDate(message.time)}
              </span>
            )}
          </div>
        </>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {refreshing && (
          <span
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <HugeiconsIcon
              icon={LoaderCircleIcon}
              className="size-4 animate-spin"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Synchronisation…</span>
            <span className="sr-only">Synchronisation en cours</span>
          </span>
        )}

        {onReply && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Répondre"
            className="shrink-0"
            onClick={onReply}
          >
            <HugeiconsIcon icon={SentIcon} className="size-5" />
          </Button>
        )}

        {onMarkUnread && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marquer comme non lu"
            className="shrink-0"
            onClick={onMarkUnread}
          >
            <HugeiconsIcon icon={MailOpen01Icon} className="size-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
