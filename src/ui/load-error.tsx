"use client"

import { InlineError } from "@/ui/inline-error"

// Alias conservé pour compatibilité : toute erreur de zone passe par
// `InlineError`, sobre et unique.
export function LoadError({
  message,
  onRetry,
  title = "Chargement impossible",
  className = "px-4 py-6",
}: {
  message: string
  onRetry?: () => void
  title?: string
  className?: string
}) {
  return (
    <InlineError
      message={message}
      onRetry={onRetry}
      title={title}
      className={className}
    />
  )
}

export { InlineError }
