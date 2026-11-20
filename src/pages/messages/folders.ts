import {
  Archive04Icon,
  Comment03Icon,
  Delete02Icon,
  File01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import type { FolderKey, Message } from "./types"

const folders = {
  inbox: { label: "Principal", icon: Archive04Icon },
  sent: { label: "Envoyés", icon: SentIcon },
  archived: { label: "Archivés", icon: Archive04Icon },
  all: { label: "Toutes", icon: Comment03Icon },
  drafts: { label: "Brouillons", icon: File01Icon },
  trash: { label: "Corbeille", icon: Delete02Icon },
}

export function getFolderOptions(pronote: boolean): readonly FolderKey[] {
  return pronote ? ["all", "drafts", "trash"] : ["inbox", "sent", "archived"]
}

export function emptyMessageFolders(): Record<FolderKey, Message[]> {
  return { inbox: [], sent: [], archived: [], all: [], drafts: [], trash: [] }
}

export function folderDetails(value: FolderKey) {
  return folders[value]
}

export function parseFolderParam(
  param: string | null,
  pronote: boolean
): FolderKey {
  const options = getFolderOptions(pronote)
  return options.find((option) => option === param) ?? options[0]
}

export function serializeFolderParam(
  value: FolderKey,
  pronote: boolean
): string | null {
  return value === getFolderOptions(pronote)[0] ? null : value
}

export function countUnreadMessages(messages: Message[]): number {
  return messages.filter((message) => message.unread && !message.sent).length
}
