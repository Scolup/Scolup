import { useState } from "react"
import { MailOpen01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Separator } from "@/components/ui/separator"
import { useFirstVisit } from "@/hooks/useFirstVisit"
import { EmptyState } from "@/components/EmptyState"
import type { FolderKey, Message } from "../types"
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
  // Changer de dossier ou de page rejoue toujours l'entrée ; revenir sur
  // l'onglet Messages, non (les premiers messages seulement, voir ENTRANCE_CAP).
  const key = `${folder}-${page}`
  const firstVisit = useFirstVisit("messages-list")
  const [initialKey] = useState(key)
  const animate = firstVisit || key !== initialKey
  const unreadCount = showUnreadHighlights ? unreadMessages.length : 0

  return (
    <div key={key}>
      {showUnreadHighlights && (
        <>
          {unreadMessages.map((message, index) => (
            <MessagePreview
              key={`unread-${message.id}`}
              {...message}
              enterIndex={animate ? index : undefined}
              query={query}
              onSelect={() => onSelect(message)}
            />
          ))}
          <Separator className="my-2" />
        </>
      )}

      {messages.length > 0 ? (
        pageMessages.map((message, index) => (
          <MessagePreview
            key={message.id}
            {...message}
            enterIndex={animate ? unreadCount + index : undefined}
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
    </div>
  )
}
