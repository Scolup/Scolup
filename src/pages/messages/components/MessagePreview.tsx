"use client"

import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Attachment01Icon } from "@hugeicons/core-free-icons"
import { cn, avatarTint } from "@/lib/utils"
import { dayName } from "@/services/dates"
import { fadeUp } from "@/hooks/use-micro-interactions"
import { highlight } from "@/ui/highlight"

function formatTime(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  if (targetDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (targetDate.getTime() === yesterday.getTime()) {
    return "hier"
  }

  if (targetDate.getTime() >= weekAgo.getTime()) {
    return dayName(date)
  }

  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`
}

interface MessagePreviewProps {
  sender?: string
  subject?: string
  body?: string
  time?: Date
  hasAttachment?: boolean
  unread?: boolean
  initials?: string
  image?: string
  className?: string
  query?: string
  onSelect?: () => void
}

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 15 },
  },
} as const

export function MessagePreview({
  sender,
  subject,
  time,
  hasAttachment = false,
  unread = false,
  initials = "??",
  image,
  className,
  query,
  onSelect,
}: MessagePreviewProps) {
  return (
    <m.div
      variants={fadeUp(12, 0.4)}
      className={cn(
        "relative flex size-full items-center justify-center p-4",
        className
      )}
    >
      <m.button
        type="button"
        onClick={onSelect}
        whileTap={{ scale: 0.975 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-input/50 p-3 text-left transition-[background-color,box-shadow] duration-200 outline-none hover:bg-muted/70 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <div
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold",
            !image && avatarTint(sender || initials)
          )}
        >
          {image ? (
            <img
              src={image}
              alt={sender ?? ""}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {unread && (
                <m.span
                  variants={dotVariants}
                  className="size-2 shrink-0 rounded-full bg-unread"
                  aria-label="Non lu"
                />
              )}
              {sender && (
                <span
                  className={cn(
                    "truncate text-sm text-card-foreground",
                    unread ? "font-bold" : "font-normal"
                  )}
                >
                  {highlight(sender, query ?? "")}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {hasAttachment && (
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {time && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(time)}
                </span>
              )}
            </div>
          </div>
          {subject && (
            <span
              className={cn(
                "truncate text-sm text-card-foreground",
                unread ? "font-semibold" : "font-normal"
              )}
            >
              {highlight(subject, query ?? "")}
            </span>
          )}
        </div>
      </m.button>
    </m.div>
  )
}
