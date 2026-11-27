import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { clearApiError, type ApiErrorDetails } from "@/services/apiErrorStore"
import { revealRoute } from "@/services/splash"
import { Button } from "./ui/button"

// Écran plein pour les erreurs API inattendues, après épuisement des 3
// tentatives. Remplace l'application : le splash et les synchronisations en
// cours n'ont donc plus de raison de rester actifs.
export function ApiErrorScreen({ code, description }: ApiErrorDetails) {
  useEffect(() => {
    revealRoute()
  }, [])

  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={1.5}
          className="size-6"
          aria-hidden="true"
        />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold text-foreground">
          Quelque chose s'est mal passé
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Scolup n'a pas pu charger tes données après plusieurs essais.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Code d'erreur
        </p>
        <p className="font-mono text-xl font-semibold text-foreground">
          {code}
        </p>
        <p className="text-left text-sm break-words text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        type="button"
        onClick={() => {
          clearApiError()
          window.location.reload()
        }}
        className="min-h-11 px-6"
      >
        Réessayer
      </Button>
    </div>
  )
}
