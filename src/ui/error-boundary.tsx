import { Component, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

// Dernier filet de sécurité : une erreur de rendu n'importe où dans l'arbre
// affiche cet écran au lieu de laisser un splash blanc définitif. On ne log
// rien (les erreurs peuvent contenir des données d'élève) : l'utilisateur
// recharge, c'est tout.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
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
            Un problème est survenu
          </h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Scolup n'a pas pu s'afficher.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11"
        >
          Recharger l'application
        </Button>
      </div>
    )
  }
}
