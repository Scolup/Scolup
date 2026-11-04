import { HugeiconsIcon } from "@hugeicons/react"
import {
  Bug01Icon,
  CheckmarkCircle02Icon,
  Idea01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { FEEDBACK_TYPES, type FeedbackType } from "../hooks/useFeedback"

const TYPE_ICONS: Record<FeedbackType, typeof Bug01Icon> = {
  bug: Bug01Icon,
  idea: Idea01Icon,
  other: Message01Icon,
}

const MAX_LENGTH = 1000

export function FeedbackDialog({
  open,
  onOpenChange,
  type,
  onTypeChange,
  message,
  onMessageChange,
  onSubmit,
  pending,
  error,
  sent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: FeedbackType
  onTypeChange: (type: FeedbackType) => void
  message: string
  onMessageChange: (message: string) => void
  onSubmit: () => void
  pending: boolean
  error: string | null
  sent: boolean
}) {
  const active = FEEDBACK_TYPES.find((entry) => entry.value === type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-foreground">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="size-6"
              />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-medium">Merci !</p>
              <p className="text-sm text-muted-foreground">
                Ton retour a bien été envoyé. Il nous aide à améliorer Scolup.
              </p>
            </div>
            <Button
              variant="secondary"
              className="mt-1 w-full"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Envoyer un retour</DialogTitle>
              <DialogDescription>
                Dis-nous ce qui te gêne ou ce qui te ferait plaisir. Ton message
                reste anonyme.
              </DialogDescription>
            </DialogHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
              }}
            >
              <div
                role="radiogroup"
                aria-label="Type de retour"
                className="grid grid-cols-3 gap-2"
              >
                {FEEDBACK_TYPES.map((option) => {
                  const selected = option.value === type
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onTypeChange(option.value)}
                      className={cn(
                        "flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        selected
                          ? "border-transparent bg-accent text-foreground"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <HugeiconsIcon
                        icon={TYPE_ICONS[option.value]}
                        strokeWidth={1.5}
                        className="size-5"
                      />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="px-0.5 text-xs text-muted-foreground">
                {active?.hint}
              </p>

              <div className="flex flex-col gap-1.5">
                <Textarea
                  value={message}
                  maxLength={MAX_LENGTH}
                  autoFocus
                  placeholder="Décris ton retour en quelques mots…"
                  onChange={(event) => onMessageChange(event.target.value)}
                />
                <span className="self-end text-xs text-muted-foreground tabular-nums">
                  {message.length}/{MAX_LENGTH}
                </span>
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!message.trim() || pending}
                  className="w-full sm:w-auto"
                >
                  {pending ? "Envoi…" : "Envoyer"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
