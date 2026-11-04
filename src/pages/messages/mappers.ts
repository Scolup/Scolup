import { initialsFromName } from "@/lib/utils"
import { decodeHtmlEntities } from "@/lib/html"
import type {
  FolderKey,
  Attachment,
  Message,
  MessageEntry,
  SenderRef,
} from "./types"
import { contactDisplayName } from "./contacts"

export function toLists(messages: {
  received?: MessageEntry[]
  sent?: MessageEntry[]
}): Record<FolderKey, Message[]> {
  return {
    inbox: (messages?.received ?? []).map(toMessage),
    sent: (messages?.sent ?? []).map((m) => ({ ...toMessage(m), sent: true })),
  }
}

function decodeBase64Content(value: string): string {
  const compact = value.replace(/\s+/g, "")
  if (compact.length < 4) return value
  try {
    const bytes = Uint8Array.from(atob(compact), (c) => c.charCodeAt(0))
    const decoded = new TextDecoder("utf-8").decode(bytes)
    return decoded.includes("�") ? value : decoded
  } catch {
    return value
  }
}

export function messageBody(detail: MessageEntry): string | undefined {
  const nested = detail.message?.contenu
  const raw =
    detail.contenu ??
    (typeof detail.content === "string" ? detail.content : undefined) ??
    nested
  return raw ? decodeBase64Content(raw) : undefined
}

export function extractAttachments(files: unknown[]): Attachment[] {
  return files
    .map((f) => {
      const obj = f as { id?: number; libelle?: string; type?: string }
      if (!obj.libelle) return null
      const id = typeof obj.id === "number" ? obj.id : Number(obj.id)
      return {
        id: Number.isFinite(id) ? id : 0,
        name: obj.libelle,
        type: obj.type ?? "PIECE_JOINTE",
      } as Attachment
    })
    .filter((x): x is Attachment => x !== null)
}

function recipientsOf(entry: MessageEntry): string[] {
  return (entry.to ?? [])
    .map((r) => {
      const raw = r.prenom || r.nom ? contactDisplayName(r) : (r.name ?? "")
      return decodeHtmlEntities(raw)
    })
    .filter((name) => name.trim() !== "")
}

export function toMessage(entry: MessageEntry): Message {
  const from = entry.from
  const rawName =
    entry.fromName ?? [from?.prenom, from?.nom].filter(Boolean).join(" ") ?? "?"
  const name = decodeHtmlEntities(rawName)
  const attachments = Array.isArray(entry.files)
    ? extractAttachments(entry.files)
    : []
  const sender = senderOf(entry)
  const recipients = recipientsOf(entry)
  return {
    id: entry.id,
    sender: name,
    ...(sender ? { senderId: sender.id } : {}),
    ...(sender?.type ? { senderType: sender.type } : {}),
    ...(recipients.length > 0 ? { recipients } : {}),
    subject: entry.subject ? decodeHtmlEntities(entry.subject) : entry.subject,
    body: messageBody(entry),
    time: entry.date,
    hasAttachment: attachments.length > 0,
    attachments: attachments.length > 0 ? attachments : undefined,
    unread: !entry.read,
    initials: initialsFromName(name),
  }
}

export function senderOf(entry: MessageEntry): SenderRef | null {
  const from = entry.from
  if (!from) return null
  const id = typeof from.id === "number" ? from.id : Number(from.id)
  if (!Number.isFinite(id)) return null
  const rawType = from.role ?? from.type
  const type = typeof rawType === "string" && rawType ? rawType : undefined
  return type ? { id, type } : { id }
}
