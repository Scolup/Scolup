import type { ReactNode } from "react"
import { ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { m } from "motion/react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"

export function SchoolPage({
  title,
  controls,
  children,
}: {
  title: string
  controls?: ReactNode
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <header className="shrink-0 border-b border-border">
        <div className="flex items-center gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Retour à l’accueil"
            className="size-11 shrink-0"
            onClick={() => navigate("/")}
          >
            <HugeiconsIcon
              icon={ArrowLeftIcon}
              className="size-5"
              aria-hidden="true"
            />
          </Button>
          <h1 className="truncate text-base font-semibold text-foreground">
            {title}
          </h1>
        </div>
        {controls && <div className="px-4 pb-3">{controls}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </m.div>
  )
}
