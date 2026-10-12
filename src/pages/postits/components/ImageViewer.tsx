import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { ImageViewerState } from "../hooks/usePostIts"

export function ImageViewer({
  viewer,
  onClose,
}: {
  viewer: ImageViewerState | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={viewer !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-auto max-w-[calc(100dvw-2rem)] border-transparent bg-black/95 p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">Image en plein écran</DialogTitle>
        {viewer && (
          <div className="relative">
            <img
              src={viewer.src}
              alt={viewer.alt}
              className="max-h-[85dvh] w-auto max-w-full cursor-zoom-out rounded-[inherit] object-contain"
            />
            <button
              type="button"
              aria-label="Fermer l’image agrandie"
              onClick={onClose}
              className="absolute inset-0 cursor-zoom-out"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fermer"
              className="absolute top-2 right-2 size-11 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
              onClick={onClose}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
