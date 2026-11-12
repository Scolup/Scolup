import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { avatarTint, cn, initialsFromName } from "@/lib/utils"
import { contactTypeLabel } from "@/pages/messages/contacts"
import { type Contact } from "@/pages/messages/types"

export function ContactRow({
  contact,
  selected,
  onToggle,
}: {
  contact: Contact
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex min-h-12 w-full press-lg items-center gap-3 rounded-2xl border px-3 py-2.5 text-left",
        selected
          ? "border-primary/40 bg-primary/10"
          : "border-border/60 bg-input/50 active:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          avatarTint(contact.name)
        )}
        aria-hidden="true"
      >
        {initialsFromName(contact.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-card-foreground">
          {contact.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {contactTypeLabel(contact.type)}
          {contact.detail ? ` · ${contact.detail}` : ""}
        </span>
      </span>
      <m.span
        aria-hidden="true"
        initial={{ scale: 1 }}
        animate={selected ? { scale: [0.4, 1] } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent"
        )}
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
      </m.span>
    </button>
  )
}
