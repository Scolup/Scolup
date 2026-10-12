"use client"

import { Notebook01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Documents } from "@/ui/documents"
import { LoadError } from "@/ui/load-error"
import { proseClassName } from "@/ui/prose"
import type { Course } from "../helpers"
import { useSessionContent } from "../hooks/useSessionContent"
import { DetailRow } from "@/ui/detail-row"

function SessionSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <DetailRow
        icon={Notebook01Icon}
        label=""
        value={
          <span className="mt-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-11/12 rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </span>
        }
      />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  )
}

export function CourseSession({ course }: { course: Course }) {
  const { session, loading, error, retry } = useSessionContent(course)
  const hasContent =
    !!session && (!!session.html || session.documents.length > 0)

  if (!error && !loading && !hasContent) return null

  return (
    <>
      <Separator className="my-4" />

      {loading ? (
        <SessionSkeleton />
      ) : error ? (
        <LoadError
          title="Contenu indisponible"
          message={error}
          onRetry={retry}
        />
      ) : (
        session && (
          <div className="flex flex-col gap-3">
            {session.html && (
              <DetailRow
                icon={Notebook01Icon}
                label="Contenu de séance"
                value={
                  <span
                    className={cn(proseClassName, "mt-1")}
                    dangerouslySetInnerHTML={{ __html: session.html }}
                  />
                }
              />
            )}

            {session.documents.length > 0 && (
              <Documents documents={session.documents} />
            )}
          </div>
        )
      )}
    </>
  )
}
