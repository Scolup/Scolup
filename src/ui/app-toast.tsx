"use client"

import { useEffect } from "react"
import { AnimatePresence, m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons"

// Mini-toast ancré au-dessus de la tab bar. Un seul composant réutilisable
// pour les erreurs d'action (coche d'un devoir, etc.) : visible même quand
// l'action a eu lieu en bas de page.
export function AppToast({
  message,
  onClose,
}: {
  message: string | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 6000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  return (
    <AnimatePresence>
      {message && (
        <m.div
          key="app-toast"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
          role="alert"
          style={{
            bottom:
              "calc(var(--tabbar-height, 3.5rem) + env(safe-area-inset-bottom) + 16px)",
          }}
          className="fixed inset-x-4 z-[60] mx-auto flex w-auto max-w-sm items-center gap-2.5 rounded-2xl border border-destructive/30 bg-card px-3.5 py-3 shadow-lg"
        >
          <HugeiconsIcon
            icon={AlertCircleIcon}
            className="size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1 text-sm font-medium text-card-foreground">
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-4"
              aria-hidden="true"
            />
          </button>
        </m.div>
      )}
    </AnimatePresence>
  )
}
