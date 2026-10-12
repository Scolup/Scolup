import { m, AnimatePresence } from "motion/react"
import { MailOpen01Icon } from "@hugeicons/core-free-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { Documents } from "@/ui/documents"
import { EmptyState } from "@/ui/empty-state"
import { InlineError } from "@/ui/inline-error"
import { proseClassName } from "@/ui/prose"
import { MESSAGE_YEAR, type Message } from "../helpers"

export function MessageContent({
  message,
  loading,
  error,
  onRetry,
}: {
  message: Message
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <m.div
          key="skeleton"
          exit={{ opacity: 0 }}
          className="flex flex-col gap-4 py-1"
          aria-hidden="true"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-11/12 rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-3/5 rounded-full" />
          </div>
        </m.div>
      ) : error ? (
        <m.div
          key="error"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.15, 1] }}
        >
          <InlineError message={error} onRetry={onRetry} />
        </m.div>
      ) : (
        <m.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.15, 1] }}
        >
          {message.body ? (
            <div
              className={proseClassName}
              dangerouslySetInnerHTML={{ __html: message.body }}
            />
          ) : (
            <EmptyState
              className="p-6"
              icon={MailOpen01Icon}
              title="Message vide"
              description="Ce message ne contient aucun texte."
            />
          )}

          {message.attachments && message.attachments.length > 0 && (
            <Documents
              documents={message.attachments}
              fileType="PIECE_JOINTE"
              year={MESSAGE_YEAR}
              bare
            />
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
