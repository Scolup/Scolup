import type { ReactNode } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog"

export function LearnScreen({
  title,
  onExit,
  children,
}: {
  title: string
  onExit: () => void
  children: ReactNode
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onExit()
      }}
    >
      <DialogPortal>
        <DialogPrimitive.Popup className="fixed inset-0 z-[70] flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground outline-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
