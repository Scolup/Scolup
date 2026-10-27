"use client"

import { useCallback } from "react"
import { m } from "motion/react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useRubies } from "@/hooks/use-rubies"

export function ShopPage() {
  const navigate = useNavigate()
  const rubies = useRubies()

  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          className="size-11 shrink-0"
          onClick={goBack}
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-foreground">
          Boutique
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 px-4 pt-12 pb-6">
          <img src="/ruby.svg" alt="" aria-hidden="true" className="size-16" />
          <div className="text-4xl font-semibold tabular-nums">{rubies}</div>
          <div className="text-sm text-muted-foreground">Rubis</div>
        </div>
      </div>
    </m.div>
  )
}
