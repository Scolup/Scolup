"use client"

import type { CSSProperties, KeyboardEvent } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Attachment01Icon,
  Comment01Icon,
  Tick02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useSubjectDisplay } from "@/services/subjects"
import { fadeUp } from "@/hooks/use-micro-interactions"
import { Badge } from "@/components/ui/badge"
import type { Assignment } from "../helpers"

function DoneToggle({
  subject,
  done,
  pending,
  onToggle,
}: {
  subject: string
  done: boolean
  pending: boolean
  onToggle?: () => void
}) {
  return (
    <m.button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle?.()
      }}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={pending}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-pressed={done}
      aria-label={
        done
          ? `Marquer « ${subject} » comme à faire`
          : `Marquer « ${subject} » comme fait`
      }
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 outline-none",
        done
          ? "border-done bg-done text-background"
          : "border-muted-foreground/40 hover:border-muted-foreground",
        pending && "cursor-progress opacity-70"
      )}
    >
      <m.span
        initial={false}
        animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 22 }}
        className="flex items-center justify-center"
      >
        <HugeiconsIcon
          icon={Tick02Icon}
          className="size-3"
          strokeWidth={3}
          aria-hidden="true"
        />
      </m.span>
    </m.button>
  )
}

function EntryMeta({
  documents,
  comments,
}: {
  documents: Assignment["documents"]
  comments: Assignment["comments"]
}) {
  if (documents.length === 0 && comments.length === 0) return null
  return (
    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
      {comments.length > 0 && (
        <span className="flex items-center gap-0.5 text-xs">
          <HugeiconsIcon
            icon={Comment01Icon}
            className="size-3.5"
            aria-hidden="true"
          />
          {comments.length}
        </span>
      )}
      {documents.length > 0 && (
        <HugeiconsIcon
          icon={Attachment01Icon}
          className="size-3.5"
          aria-hidden="true"
        />
      )}
    </span>
  )
}

interface HomeworkEntryProps {
  assignment: Assignment
  pending?: boolean
  isNew?: boolean
  onToggle?: () => void
  onSelect?: (assignment: Assignment) => void
}

export function HomeworkEntry({
  assignment,
  pending = false,
  isNew = false,
  onToggle,
  onSelect,
}: HomeworkEntryProps) {
  const { subject, done, isTest, documents, comments } = assignment
  const { display, color } = useSubjectDisplay(assignment.subjectCode, subject)

  const open = onSelect ? () => onSelect(assignment) : undefined
  const onActivate = open
    ? () => {
        open()
      }
    : undefined
  const onActivateKey = open
    ? (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          open()
        }
      }
    : undefined

  return (
    <m.div
      variants={fadeUp(12, 0.4)}
      layout
      exit={{ opacity: 0, scale: 0.98 }}
      className="px-4 py-1.5"
    >
      <m.div
        role={open ? "button" : undefined}
        tabIndex={open ? 0 : undefined}
        aria-label={open ? `Voir le devoir de ${display}` : undefined}
        onClick={(e) => {
          const target = e.target as HTMLElement | null
          if (target?.closest("button")) return
          onActivate?.()
        }}
        onKeyDown={onActivateKey}
        whileTap={open ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-2xl border border-transparent bg-input/50 px-3.5 py-3 transition-[background-color,box-shadow,opacity] duration-200",
          "hover:bg-muted/70 hover:shadow-sm has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30",
          open && "cursor-pointer",
          done && "opacity-55"
        )}
      >
        <DoneToggle
          subject={display}
          done={done}
          pending={pending}
          onToggle={onToggle}
        />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-bold",
                done && "line-through decoration-muted-foreground/50",
                color &&
                  "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]"
              )}
              style={color ? ({ "--c": color } as CSSProperties) : undefined}
            >
              {display}
            </span>
            {isTest && (
              <Badge variant="warning" size="sm" pill className="shrink-0">
                Éval.
              </Badge>
            )}
            {isNew && (
              <Badge variant="info" size="sm" pill className="shrink-0">
                Nouveau
              </Badge>
            )}
            {assignment.onlineSubmission && (
              <Badge
                variant="outline"
                size="sm"
                pill
                className="shrink-0 gap-1"
              >
                <HugeiconsIcon
                  icon={Upload04Icon}
                  className="size-3"
                  aria-hidden="true"
                />
                À rendre en ligne
              </Badge>
            )}
          </span>

          <EntryMeta documents={documents} comments={comments} />
        </div>
      </m.div>
    </m.div>
  )
}
