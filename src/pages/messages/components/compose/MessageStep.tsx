import { useRef } from "react"
import { m, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Attachment01Icon,
  Cancel01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { EASE_OUT } from "@/lib/motion"
import { MAX_SUBJECT_LENGTH } from "@/pages/messages/compose"
import type { ComposeState } from "@/pages/messages/hooks/useCompose"

export function MessageStep({ compose }: { compose: ComposeState }) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        void compose.send()
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {compose.mode === "new" && (
          <button
            type="button"
            onClick={() => compose.setStep(1)}
            className="flex min-h-11 w-full press-lg items-center gap-2 rounded-2xl border border-border/60 bg-input/50 px-3 text-left text-sm"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1 truncate">
              À :{" "}
              <strong>
                {compose.recipients.map((r) => r.name).join(", ")}
              </strong>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary-text">
              Modifier
            </span>
          </button>
        )}

        <div
          className={cn(
            "flex items-baseline justify-between gap-2",
            compose.mode === "new" && "pt-4"
          )}
        >
          <label
            htmlFor="compose-subject"
            className="pb-1.5 text-sm font-medium text-card-foreground"
          >
            Objet
          </label>
          {compose.subject.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {compose.subject.length}/{MAX_SUBJECT_LENGTH}
            </span>
          )}
        </div>
        <Input
          id="compose-subject"
          value={compose.subject}
          onChange={(e) => compose.setSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
            }
          }}
          placeholder="Ex : Absence du 12 octobre"
          className="min-h-11"
          maxLength={MAX_SUBJECT_LENGTH}
        />

        <label
          htmlFor="compose-body"
          className="block pt-4 pb-1.5 text-sm font-medium text-card-foreground"
        >
          Message
        </label>
        <Textarea
          id="compose-body"
          value={compose.content}
          onChange={(e) => compose.setContent(e.target.value)}
          placeholder="Bonjour,…"
          className="min-h-44"
          rows={10}
        />

        <input
          ref={fileRef}
          type="file"
          multiple
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) compose.addAttachments(e.target.files)
            e.target.value = ""
          }}
        />
        {compose.attachments.length > 0 && (
          <ul
            className="flex flex-col gap-1.5 pt-3"
            aria-label="Pièces jointes"
          >
            {compose.attachments.map((file, i) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/60 bg-input/50 px-3 text-sm"
              >
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => compose.removeAttachment(i)}
                  disabled={compose.sending}
                  aria-label={`Retirer ${file.name}`}
                  className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={compose.sending}
            className="min-h-11 w-full"
            size="lg"
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              className="size-4"
              aria-hidden="true"
            />
            Joindre un fichier
          </Button>
          <Button
            type="submit"
            disabled={compose.sending}
            className="min-h-11 w-full"
            size="lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={compose.sending ? "sending" : "idle"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                className="flex items-center gap-1.5"
              >
                {compose.sending ? (
                  <>
                    <Spinner className="size-4 border-primary-foreground border-t-transparent" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={SentIcon}
                      className="size-4"
                      aria-hidden="true"
                    />
                    Envoyer
                  </>
                )}
              </m.span>
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </form>
  )
}
