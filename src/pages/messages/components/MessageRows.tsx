import { m } from "motion/react"
import { MailOpen01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Separator } from "@/components/ui/separator"
import { staggerContainer } from "@/hooks/use-micro-interactions"
import { EmptyState } from "@/ui/empty-state"
import type { FolderKey, Message } from "../helpers"
import { MessagePreview } from "./MessagePreview"

export function MessageRows({
  folder,
  unreadMessages,
  showUnreadHighlights,
  messages,
  pageMessages,
  query,
  page,
  onSelect,
}: {
  folder: FolderKey
  unreadMessages: Message[]
  showUnreadHighlights: boolean
  messages: Message[]
  pageMessages: Message[]
  query: string
  page: number
  onSelect: (message: Message) => void
}) {
  return (
    <m.div
      key={`${folder}-${page}`}
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.045, 0.05)}
    >
      {showUnreadHighlights && (
        <>
          {unreadMessages.map((message) => (
            <MessagePreview
              key={`unread-${message.id}`}
              {...message}
              query={query}
              onSelect={() => onSelect(message)}
            />
          ))}
          <Separator className="my-2" />
        </>
      )}

      {messages.length > 0 ? (
        pageMessages.map((message) => (
          <MessagePreview
            key={message.id}
            {...message}
            query={query}
            onSelect={() => onSelect(message)}
          />
        ))
      ) : (
        <EmptyState
          icon={query.trim() ? Search01Icon : MailOpen01Icon}
          title={query.trim() ? "Aucun résultat" : "Boîte vide"}
          description={
            query.trim()
              ? `Aucun message ne correspond à « ${query.trim()} ».`
              : "Tu n'as aucun message dans ce dossier pour le moment."
          }
        />
      )}
    </m.div>
  )
}
