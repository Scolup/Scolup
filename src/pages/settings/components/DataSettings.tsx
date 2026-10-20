"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Refresh01Icon } from "@hugeicons/core-free-icons"
import { AppToast } from "@/ui/app-toast"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { triggerHapticMedium } from "@/services/haptics"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function DataSettings() {
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refreshCache = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await ld.cache.clear()
      await ld.getAll()
      triggerHapticMedium()
      setMessage("Données actualisées.")
    } catch (err) {
      setMessage(errorMessage(err, "Actualisation impossible."))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">
        Cache et synchronisation
      </p>
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card px-4 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-card-foreground">
            Rafraîchir les données
          </span>
          <span className="text-xs text-muted-foreground">
            Vide le cache et recharge notes, agenda, devoirs et messages depuis
            ÉcoleDirecte.
          </span>
        </div>
        <Button
          variant="secondary"
          disabled={refreshing}
          onClick={() => void refreshCache()}
          className="gap-2 self-start"
        >
          {refreshing ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon
              icon={Refresh01Icon}
              strokeWidth={1.5}
              aria-hidden="true"
              className="size-4"
            />
          )}
          {refreshing ? "Actualisation…" : "Rafraîchir"}
        </Button>
      </div>

      <AppToast message={message} onClose={() => setMessage(null)} />
    </div>
  )
}
