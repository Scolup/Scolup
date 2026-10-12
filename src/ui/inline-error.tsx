"use client"

import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CloudOffIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FadeIn } from "@/ui/fade-in"

// Présentation unique des erreurs de zone (listes, pages, widgets, contenus
// de drawer). Sobre : pas d'alerte rouge. Le bouton relance la requête via
// `onRetry`, sans recharger la page.
export function InlineError({
  message,
  onRetry,
  title = "Impossible de charger",
  actionLabel = "Réessayer",
  action,
  className,
}: {
  message: string
  onRetry?: () => void
  title?: string
  actionLabel?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <FadeIn className={className ?? "px-4 py-6"}>
      <Empty className="p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={CloudOffIcon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {action ??
            (onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="min-h-11"
              >
                {actionLabel}
              </Button>
            ))}
        </EmptyContent>
      </Empty>
    </FadeIn>
  )
}
