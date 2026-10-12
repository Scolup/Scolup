import { HugeiconsIcon } from "@hugeicons/react"
import { m, AnimatePresence } from "motion/react"
import { EASE_OUT } from "@/hooks/use-micro-interactions"
import {
  Calendar02Icon,
  Comment01Icon,
  Notebook01Icon,
  SendIcon,
  TeacherIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Documents } from "@/ui/documents"
import { DetailRow } from "@/ui/detail-row"
import { EmptyState } from "@/ui/empty-state"
import { proseClassName } from "@/ui/prose"
import type { CommentComposer } from "../hooks/useHomeworkComment"
import type { Assignment, HomeworkComment } from "../helpers"

function CommentRow({ comment }: { comment: HomeworkComment }) {
  return (
    <li className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-input/50 px-3 py-2.5">
      {(comment.author || comment.date) && (
        <span className="text-xs font-medium text-muted-foreground">
          {comment.author ?? "Commentaire"}
          {comment.date
            ? ` · ${comment.date.toLocaleDateString("fr", { day: "numeric", month: "short" })}`
            : ""}
        </span>
      )}
      {comment.message && (
        <span className="text-sm break-words whitespace-pre-wrap text-card-foreground">
          {comment.message}
        </span>
      )}
    </li>
  )
}

function CommentForm({
  assignment,
  comment,
}: {
  assignment: Assignment
  comment: CommentComposer
}) {
  const canSend = comment.draft.trim().length > 0 && !comment.pending

  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSend) void comment.send(assignment)
      }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          value={comment.draft}
          onChange={(event) => comment.setDraft(event.target.value)}
          placeholder="Répondre au devoir…"
          aria-label="Commentaire"
          rows={1}
          maxLength={1000}
          disabled={comment.pending}
          className="min-h-11 flex-1"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Envoyer le commentaire"
          disabled={!canSend}
          className="size-11 shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={comment.pending ? "sending" : "idle"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex"
            >
              {comment.pending ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={SendIcon} aria-hidden="true" />
              )}
            </m.span>
          </AnimatePresence>
        </Button>
      </div>
    </form>
  )
}

export function HomeworkContent({
  assignment,
  pending,
  onToggle,
  comment,
}: {
  assignment: Assignment
  pending: boolean
  onToggle: (assignment: Assignment) => void
  comment: CommentComposer
}) {
  return (
    <div className="flex flex-col gap-3">
      {assignment.teacher && (
        <DetailRow
          icon={TeacherIcon}
          label="Professeur"
          value={assignment.teacher}
        />
      )}

      <DetailRow
        icon={Calendar02Icon}
        label="À faire pour"
        value={assignment.due.toLocaleDateString("fr", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      {assignment.content ? (
        <DetailRow
          icon={Notebook01Icon}
          label="Contenu"
          value={
            <span
              className={cn(proseClassName, "mt-1")}
              dangerouslySetInnerHTML={{ __html: assignment.content }}
            />
          }
        />
      ) : (
        <EmptyState
          className="p-6"
          icon={Notebook01Icon}
          title="Sans contenu détaillé"
          description="Ton professeur n'a pas joint de contenu à ce devoir."
        />
      )}

      {assignment.documents.length > 0 && (
        <Documents documents={assignment.documents} />
      )}

      <DetailRow
        icon={Comment01Icon}
        label={
          assignment.comments.length > 0
            ? `Commentaires · ${assignment.comments.length}`
            : "Commentaires"
        }
        value={
          <>
            {assignment.comments.length > 0 && (
              <ul className="mt-2 flex flex-col gap-2">
                {assignment.comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} />
                ))}
              </ul>
            )}
            <CommentForm assignment={assignment} comment={comment} />
          </>
        }
      />

      <Button
        type="button"
        variant={assignment.done ? "outline" : "default"}
        disabled={pending}
        onClick={() => onToggle(assignment)}
        className="mt-1 min-h-11 w-full"
      >
        <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
        {assignment.done ? "Marquer à faire" : "Marquer comme fait"}
      </Button>
    </div>
  )
}
