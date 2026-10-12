"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import type { Award02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

// Coquille sobre des widgets de l'accueil, à hauteur réservée : un widget en
// échec ou vide le dit au lieu de disparaître (`return null` interdit).
function WidgetShell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-label={label}
      className="flex min-h-[76px] flex-col justify-center gap-1 rounded-3xl border border-border/70 bg-card p-4"
    >
      {children}
    </section>
  )
}

export function WidgetEmpty({
  icon = CheckmarkCircle02Icon,
  title,
  hint,
  label,
}: {
  icon?: typeof Award02Icon
  title: string
  hint: string
  label?: string
}) {
  return (
    <WidgetShell label={label ?? title}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-card-foreground">
            {title}
          </span>
          <span className="truncate text-xs text-muted-foreground">{hint}</span>
        </div>
      </div>
    </WidgetShell>
  )
}

export function WidgetError({
  onRetry,
  label = "Contenu indisponible",
}: {
  onRetry?: () => void
  label?: string
}) {
  return (
    <WidgetShell label={label}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-card-foreground">
            Contenu indisponible
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Impossible de charger ce contenu.
          </span>
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="min-h-11 shrink-0"
          >
            Réessayer
          </Button>
        )}
      </div>
    </WidgetShell>
  )
}
