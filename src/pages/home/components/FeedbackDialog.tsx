import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function FeedbackDialog({
  open,
  onOpenChange,
  message,
  onMessageChange,
  onSubmit,
  pending,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  onMessageChange: (message: string) => void
  onSubmit: () => void
  pending: boolean
  error: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Feedback</DialogTitle>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <Textarea
            value={message}
            maxLength={1000}
            placeholder="Qu'est-ce qui te manque ?"
            onChange={(event) => onMessageChange(event.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={!message.trim() || pending}>
            {pending ? "Envoi…" : "Envoyer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
