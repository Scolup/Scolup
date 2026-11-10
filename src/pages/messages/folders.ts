import { Archive04Icon, SentIcon } from "@hugeicons/core-free-icons"
import type { FolderKey, Message } from "./types"

const folderLabels: Record<FolderKey, string> = {
  inbox: "Principal",
  sent: "Envoyés",
  archived: "Archivés",
}

export function folderIcon(value: FolderKey): typeof Archive04Icon {
  if (value === "sent") return SentIcon
  return Archive04Icon
}

export function folderLabel(value: FolderKey): string {
  return folderLabels[value]
}

export function parseFolderParam(param: string | null): FolderKey {
  if (param === "sent" || param === "archived") return param
  return "inbox"
}

export function serializeFolderParam(value: FolderKey): string | null {
  if (value === "sent" || value === "archived") return value
  return null
}

export function countUnreadMessages(messages: Message[]): number {
  return messages.filter((message) => message.unread && !message.sent).length
}
