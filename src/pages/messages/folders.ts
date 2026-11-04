import { Archive04Icon, SentIcon } from "@hugeicons/core-free-icons"
import type { FolderKey, Message } from "./types"

const folderLabels: Record<FolderKey, string> = {
  inbox: "Principal",
  sent: "Envoyés",
}

export function folderIcon(value: FolderKey): typeof Archive04Icon {
  if (value === "sent") return SentIcon
  return Archive04Icon
}

export function folderLabel(value: FolderKey): string {
  return folderLabels[value]
}

export function parseFolderParam(param: string | null): FolderKey {
  if (param === "sent") return "sent"
  return "inbox"
}

export function serializeFolderParam(value: FolderKey): string | null {
  if (value === "sent") return "sent"
  return null
}

export function countUnreadMessages(messages: Message[]): number {
  return messages.filter((message) => message.unread && !message.sent).length
}
