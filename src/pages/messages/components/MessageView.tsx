import { Skeleton } from "@/components/ui/skeleton"
import type { Message } from "../helpers"
import { MessageContent } from "./MessageContent"
import { MessageHeader } from "./MessageHeader"

export interface MessageViewProps {
  message: Message | null
  contentLoading?: boolean
  contentRefreshing?: boolean
  contentError?: string | null
  onRetry?: () => void
  onClose?: () => void
  closeIcon?: "back" | "close"
  onMarkUnread?: () => void
  onReply?: () => void
}

export function MessageView(props: MessageViewProps) {
  const { message } = props
  if (!message) return null

  const placeholder =
    Boolean(props.contentLoading) && !message.sender && !message.subject

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <MessageHeader
        message={message}
        placeholder={placeholder}
        onClose={props.onClose}
        closeIcon={props.closeIcon}
        refreshing={props.contentRefreshing}
        onMarkUnread={props.onMarkUnread}
        onReply={placeholder ? undefined : props.onReply}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {placeholder ? (
          <Skeleton
            className="mb-3 h-5 w-2/3 rounded-full"
            aria-hidden="true"
          />
        ) : (
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {message.subject}
          </h2>
        )}

        <MessageContent
          message={message}
          loading={props.contentLoading}
          error={props.contentError}
          onRetry={props.onRetry}
        />
      </div>
    </div>
  )
}
