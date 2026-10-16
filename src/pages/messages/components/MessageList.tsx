import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { Skeleton } from "@/components/ui/skeleton"
import { skeletonSenderWidths, skeletonSubjectWidths } from "../helpers"
import type { FolderKey, Message } from "../helpers"
import { InlineError } from "@/ui/inline-error"
import { FolderSearchBar } from "./FolderSearchBar"
import { MessagePagination } from "./MessagePagination"
import { MessageRows } from "./MessageRows"

function MessageListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex size-full items-center justify-center p-4">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-input/50 p-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton
                  className={cn(
                    "h-3.5 rounded-full",
                    skeletonSenderWidths[i % skeletonSenderWidths.length]
                  )}
                />
                <Skeleton className="h-3 w-8 shrink-0 rounded-full" />
              </div>
              <Skeleton
                className={cn(
                  "h-3.5 rounded-full",
                  skeletonSubjectWidths[i % skeletonSubjectWidths.length]
                )}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface MessageListProps {
  folder: FolderKey
  onFolderChange: (value: FolderKey) => void
  input: string
  onInputChange: (value: string) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  messages: Message[]
  query: string
  unreadMessages: Message[]
  showUnreadHighlights: boolean
  pageMessages: Message[]
  page: number
  currentPage: number
  totalPages: number
  pages: number[]
  leftEllipsis: boolean
  rightEllipsis: boolean
  onSelect: (message: Message) => void
  onPageChange: (page: number) => void
}

export function MessageList({
  folder,
  onFolderChange,
  input,
  onInputChange,
  loading,
  error,
  onRetry,
  messages,
  query,
  unreadMessages,
  showUnreadHighlights,
  pageMessages,
  page,
  currentPage,
  totalPages,
  pages,
  leftEllipsis,
  rightEllipsis,
  onSelect,
  onPageChange,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const showSkeleton = useDelayedLoading(loading)

  useEffect(() => {
    containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [folder, currentPage])

  return (
    <div
      ref={containerRef}
      className="flex min-h-[50dvh] w-full flex-col gap-0"
    >
      <FolderSearchBar
        folder={folder}
        onFolderChange={onFolderChange}
        input={input}
        onInputChange={onInputChange}
      />

      {loading ? (
        showSkeleton ? (
          <MessageListSkeleton />
        ) : null
      ) : error ? (
        <InlineError message={error} onRetry={onRetry} />
      ) : (
        <>
          <MessageRows
            folder={folder}
            unreadMessages={unreadMessages}
            showUnreadHighlights={showUnreadHighlights}
            messages={messages}
            pageMessages={pageMessages}
            query={query}
            page={currentPage}
            onSelect={onSelect}
          />

          <MessagePagination
            page={page}
            currentPage={currentPage}
            totalPages={totalPages}
            pages={pages}
            leftEllipsis={leftEllipsis}
            rightEllipsis={rightEllipsis}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
