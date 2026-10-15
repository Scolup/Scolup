"use client"

import type { CSSProperties } from "react"
import { Calendar02Icon, TeacherIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DetailRow } from "@/ui/detail-row"
import { InlineError } from "@/ui/inline-error"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useSubjectDisplay } from "@/services/subjects"
import { dayLabel, formatGivenOn } from "../helpers"
import type { CommentComposer } from "../hooks/useHomeworkComment"
import type { Assignment } from "../helpers"
import { HomeworkContent } from "./HomeworkContent"

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <DetailRow
        icon={TeacherIcon}
        label=""
        value={
          <span className="mt-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-full" />
          </span>
        }
      />
      <DetailRow
        icon={Calendar02Icon}
        label=""
        value={
          <span className="mt-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </span>
        }
      />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="mt-1 h-11 w-full rounded-2xl" />
    </div>
  )
}

export function HomeworkDrawer({
  assignment,
  detail,
  loading,
  error,
  onRetry,
  pending,
  onToggle,
  comment,
  onClose,
}: {
  assignment: Assignment | null
  detail: Assignment | null
  loading: boolean
  error: string | null
  onRetry: () => void
  pending: boolean
  onToggle: (assignment: Assignment) => void
  comment: CommentComposer
  onClose: () => void
}) {
  const shown = detail ?? assignment
  const showDetailSkeleton = useDelayedLoading(loading)
  const { display, color } = useSubjectDisplay(
    shown?.subjectCode,
    shown?.subject
  )

  return (
    <Drawer
      open={!!assignment}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DrawerContent>
        {shown && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-1">
              <span
                className={cn(
                  "text-lg font-bold break-words",
                  !color && "text-card-foreground",
                  color &&
                    "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]"
                )}
                style={color ? ({ "--c": color } as CSSProperties) : undefined}
              >
                {display}
              </span>
              <span className="text-xs text-muted-foreground">
                Pour {dayLabel(shown.due).toLowerCase()}
                {shown.givenOn ? ` · ${formatGivenOn(shown.givenOn)}` : ""}
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {shown.isTest && (
                  <Badge variant="warning" size="sm">
                    Évaluation
                  </Badge>
                )}
                <Badge variant={shown.done ? "success" : "secondary"} size="sm">
                  {shown.done ? "Fait" : "À faire"}
                </Badge>
                {shown.onlineSubmission && (
                  <Badge variant="info" size="sm">
                    À rendre en ligne
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {loading ? (
              showDetailSkeleton ? (
                <DetailSkeleton />
              ) : null
            ) : error ? (
              <InlineError
                title="Contenu indisponible"
                message={error}
                onRetry={onRetry}
              />
            ) : (
              <HomeworkContent
                assignment={shown}
                pending={pending}
                onToggle={onToggle}
                comment={comment}
              />
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
