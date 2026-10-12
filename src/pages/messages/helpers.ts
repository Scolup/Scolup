import { Archive04Icon, SentIcon } from "@hugeicons/core-free-icons"

import { initialsFromName } from "@/lib/utils"
import { decodeHtmlEntities, htmlToText } from "@/services/html"

export type FolderKey = "inbox" | "sent"

export interface Attachment {
  id: number
  name: string
  type: string
}

export interface Message {
  id: number
  sender?: string
  senderId?: number
  senderType?: string
  subject?: string
  body?: string
  time?: Date
  hasAttachment?: boolean
  attachments?: Attachment[]
  unread?: boolean
  initials?: string
  sent?: boolean
}

export interface MessageEntry {
  id: number
  subject?: string
  contenu?: string
  content?: string
  fromName?: string
  from?: {
    prenom?: string
    nom?: string
    id?: number | string
    role?: string
    type?: string
  }
  date?: Date
  files?: unknown[]
  read?: boolean
  message?: { contenu?: string }
}

export const PAGE_SIZE = 15

const now = new Date()
const year = now.getFullYear()
export const MESSAGE_YEAR =
  now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`

export const skeletonSenderWidths = ["w-28", "w-24", "w-32", "w-20", "w-28"]
export const skeletonSubjectWidths = [
  "w-2/3",
  "w-4/5",
  "w-1/2",
  "w-3/4",
  "w-3/5",
]

const folderIcons: Record<FolderKey, typeof Archive04Icon> = {
  inbox: Archive04Icon,
  sent: SentIcon,
}

const folderLabels: Record<FolderKey, string> = {
  inbox: "Principal",
  sent: "Envoyés",
}

export function folderIcon(value: FolderKey): typeof Archive04Icon {
  return folderIcons[value]
}

export function folderLabel(value: FolderKey): string {
  return folderLabels[value]
}

export function parseFolderParam(param: string | null): FolderKey {
  return param === "sent" ? "sent" : "inbox"
}

export function serializeFolderParam(value: FolderKey): string | null {
  return value === "sent" ? "sent" : null
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

export function toMessage(entry: MessageEntry): Message {
  const from = entry.from
  const rawName =
    entry.fromName ?? [from?.prenom, from?.nom].filter(Boolean).join(" ") ?? "?"
  const name = decodeHtmlEntities(rawName)
  const attachments = Array.isArray(entry.files)
    ? extractAttachments(entry.files)
    : []
  const sender = senderOf(entry)
  return {
    id: entry.id,
    sender: name,
    ...(sender ? { senderId: sender.id } : {}),
    ...(sender?.type ? { senderType: sender.type } : {}),
    subject: entry.subject ? decodeHtmlEntities(entry.subject) : entry.subject,
    body: messageBody(entry),
    time: entry.date,
    hasAttachment: attachments.length > 0,
    attachments: attachments.length > 0 ? attachments : undefined,
    unread: !entry.read,
    initials: initialsFromName(name),
  }
}

export function countUnreadMessages(messages: Message[]): number {
  return messages.filter((message) => message.unread && !message.sent).length
}

export function buildPagination(
  totalPages: number,
  currentPage: number,
  maxSlots: number
): { pages: number[]; leftEllipsis: boolean; rightEllipsis: boolean } {
  if (totalPages <= maxSlots) {
    return {
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      leftEllipsis: false,
      rightEllipsis: false,
    }
  }

  const half = Math.floor((maxSlots - 1) / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, currentPage + half)

  if (end - start + 1 < maxSlots) {
    if (start === 1) end = maxSlots
    else start = totalPages - maxSlots + 1
  }

  return {
    pages: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    leftEllipsis: start > 1,
    rightEllipsis: end < totalPages,
  }
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export interface Contact {
  id: number
  type: string
  name: string
  detail?: string
  raw: unknown
}

export function contactDisplayName(entry: {
  prenom?: string
  nom?: string
  civilite?: string
}): string {
  const full = [entry.prenom, entry.nom].filter(Boolean).join(" ").trim()
  if (!full) return "Sans nom"
  return entry.civilite ? `${entry.civilite} ${full}` : full
}

export function toContact(entry: unknown): Contact | null {
  const obj = entry as {
    id?: number | string
    type?: string
    prenom?: string
    nom?: string
    civilite?: string
    matiere?: string
    fonction?: { libelle?: string }
    classes?: { matiere?: string }[]
  }
  const id = typeof obj?.id === "number" ? obj.id : Number(obj?.id)
  if (!obj || !Number.isFinite(id)) return null
  const name = contactDisplayName(obj)
  const detail =
    obj.matiere ||
    obj.classes?.find((c) => c.matiere)?.matiere ||
    obj.fonction?.libelle ||
    undefined
  return {
    id,
    type: typeof obj.type === "string" ? obj.type : "P",
    name,
    detail,
    raw: entry,
  }
}

export function contactTypeLabel(type: string): string {
  if (type === "P") return "Enseignant"
  if (type === "A") return "Personnel"
  return "Contact"
}

export function mergeContacts(entries: unknown[]): Contact[] {
  const seen = new Set<string>()
  const list: Contact[] = []
  for (const entry of entries) {
    const contact = toContact(entry)
    if (!contact) continue
    const key = `${contact.type}-${contact.id}`
    if (seen.has(key)) continue
    seen.add(key)
    list.push(contact)
  }
  list.sort((a, b) => a.name.localeCompare(b.name, "fr"))
  return list
}

export function filterContacts(contacts: Contact[], query: string): Contact[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return contacts
  return contacts.filter((c) =>
    `${c.name} ${c.detail ?? ""}`.toLowerCase().includes(normalized)
  )
}

export function findContactForSender(
  sender: string | undefined,
  contacts: Contact[]
): Contact | undefined {
  if (!sender) return undefined
  const normalized = sender.trim().toLowerCase()
  if (!normalized) return undefined
  return contacts.find((c) => c.name.toLowerCase().includes(normalized))
}

export interface SenderRef {
  id: number
  type?: string
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

export function resolveReplyRecipient(
  message: Message,
  contacts: Contact[]
): Contact | null {
  // ponytail: l'ID expéditeur du payload répond toujours, même quand le
  // nom ne matche aucun contact (homonymes, "Vie scolaire", ...).
  if (message.senderId !== undefined && Number.isFinite(message.senderId)) {
    const byId = contacts.filter((c) => c.id === message.senderId)
    if (byId.length > 0) {
      const typed = message.senderType
        ? byId.find((c) => c.type === message.senderType)
        : undefined
      return typed ?? byId[0]
    }
    if (message.senderType) {
      const raw = { id: message.senderId, type: message.senderType }
      const name = message.sender?.trim() || "Sans nom"
      return { id: message.senderId, type: message.senderType, name, raw }
    }
  }
  return findContactForSender(message.sender, contacts) ?? null
}

export function buildReplySubject(subject?: string): string {
  const clean = subject?.trim() ?? ""
  if (!clean) return "Re: ton message"
  return /^re\s*:/i.test(clean) ? clean : `Re: ${clean}`
}

function stripHtmlTags(html: string): string {
  return htmlToText(html)
}

export function buildReplyBody(message: Message): string {
  const quoted = message.body ? stripHtmlTags(message.body) : ""
  const when = message.time ? formatFullDate(message.time) : null
  const header =
    message.sender && when
      ? `Le ${when}, ${message.sender} écrivait :`
      : message.sender
        ? `${message.sender} écrivait :`
        : "Message d'origine :"
  const lines = quoted
    ? quoted
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")
    : "> (sans contenu)"
  return `\n\n${header}\n${lines}`
}

export function validateCompose(
  recipients: Contact[],
  subject: string,
  content: string
): string | null {
  if (recipients.length === 0) return "Choisis au moins un destinataire."
  if (!subject.trim()) return "Ajoute un objet à ton message."
  if (!content.trim()) return "Écris quelques mots avant d'envoyer."
  return null
}

export const SCOLUP_SIGNATURE_TEXT = "Envoyé avec Scolup"

// Étoile Scolup grise (PNG 48 px, ~1,8 Ko en base64) en data URI :
// le logo voyage dans le message, lisible même hors-ligne. PNG plutôt
// que SVG : bien plus de clients mails affichent les PNG embarqués.
export const SCOLUP_LOGO_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAFDklEQVRoge1ZXWwUVRT+zp2utdsmK4koPIgKSiQ+wQtGlPCgiT+AGgkYMf4kmJoQNLK7M9u+dE2kdu60NcanffHFNkAq8KCAMRCJGGOICREF0mDRoBEDmlqDW2vn3uNDZ2Ntd2fuTEeLCd/Tzr3nnO/7Zmfm3DtDSBm9vb03aq13MPMGIloeDA8z8/tKqbc7Ozt/SZOP0izmed6jzDwA4IYGIaNCiK2FQuFwWpypGXBd90EiOgSgKSJUCSE2pGUiFQOe57Uy8zcAFpnEM/NFIcSdxWLx97lyi7kWCAQ9C0PxAEBEiwE8kwZ3KgYAPBw3gZlj59RDWgZujZtARLelQZyWgcm4CcwcO6ceUjFARN8myPkuDe60/oFTcROY+cs0iFMxoLWOLYaIUjHQsOn09/e3TExMLLYsq2rb9k9hRbTWpyzLikXs+/5XUTFSykVKqWxzc/PFnTt3jteLmdXIpJRbiOhlZl4NoKbqewCDRPRmsVi8NDOHmcnzvFEAOUP9Y8VicQER8cwJz/NuYuZXAWwFcEswrAB8DuAt27aH6hro7+9v8X1/D4CNjViJ6IrWum98fLy3XC5fmT4npfwEwP2GBo7btr12+kC5XG5raWkpCCHyzNwWknugWq0+XS6X/wCCe4CZyff93WHig7g2IurKZrMjUsrtlUolM2162FD8P2IrlUpGSrk9m82OEFFXhHgAeKK1tXWwdkDA1GUDYE8MATWMMHOXZVkntdb7ANxlmHdWCLFJKbWSiF4DsCwB92bbtodqN/GOBAUAYBkRDWit4+at0FqfJprTWvIVAEMUrCR/RfQy+GqDX61Wc8L3/Zvx/xMPAE1tbW0LhWVZ1flWkhTMPC6CJvXjfItJgB+KxeIlAQBE9O58q0mAASDoA77vuwBClwtXE5j5olJKAoGBjo6OUWZ+DMBv86rMDGMANnZ0dIwC01ajjuOcALAKwJF5EmaCj5RSqxzH+aI2ULeT9PT03C2EeADACkx1yaUAluC/e9z6AC4AOA9gBMBZrfWRUql0emagcSusVCqZsbGxJcy8lIhWAyjj79XqXKGIqEtrfYKIzudyuQvt7e1GW87EvdzzvOPMfF/S/BmYtTo1RaIdmed564L9Qlq4x/O8dUkSYxuQUj7EzIcAZCKDzZFh5g9d1w1dztdDLANSyvUADgBoiUtkgGYiGpJSPhknydiA53lPAdgP4Pq4ymLgOgB7Xdd9zjTByICUchszDyLdy6YRLCJ6R0q5zSQ48inkuu4mItqL9N4hmUIz8xbHcd4LCwo10N3dvbCpqWkYwIKEAko0te16A8lOwKgQYnmhUPi5UUBo0Uwm8xKSiQcR7Xccx7NtW2Lqxk+CBUqpF8MCQg3M4RU4CyG6aweWZe0CMOsdkAmEEI+Ezkfk356EFMDhfD5/snYQ/E70SYmZQzVEGZhIQqq13mUyZog/wyajLqGvExB+XCqVPps5GIwdS1Av9B1qqAEiCn2E1QMzNzzTzPx63HoA9oVNhhrI5XKDAM6YMjHzQcdxjjaadxznKDMfNK0H4HQul9sdFhBqoL29fVJrvRnAZQOyYcuyno8KUkq9AOCcQb3LQojNUfuCyOYS7ILWENGnjWKIaL/v+2vCGk4NnZ2dl4UQ9yKkNwRcawqFQuS/b7yhCb4BrAWwHsAdACaZ+QwzHyiVSom+tvT19a1USj2Oqa1rhojOEdEH+Xz+eL1vB9dwDf8C/gIoqug7yte3YgAAAABJRU5ErkJggg=="

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function signatureHtml(): string {
  return `<br><br><p><i style="font-size:12px;color:#8a8a8a">${SCOLUP_SIGNATURE_TEXT} <img src="${SCOLUP_LOGO_DATA_URI}" alt="Scolup" width="12" height="12" style="width:12px;height:12px;vertical-align:-2px;border:0"></i></p>`
}

export function withScolupSignature(content: string): string {
  const clean = content.trim()
  if (!clean) return clean
  // L'encodage des accents en entités vit dans Linkdirecte (sendMessage) :
  // tous ses consommateurs en profitent, pas seulement Scolup.
  const body = escapeHtml(clean).replace(/\n/g, "<br>")
  return `${body}${signatureHtml()}`
}

export const MAX_SUBJECT_LENGTH = 120

export interface ComposeDraft {
  recipients: Contact[]
  subject: string
  content: string
}

const EMPTY_DRAFT: ComposeDraft = { recipients: [], subject: "", content: "" }

function recipientKey(r: Contact): string {
  return `${r.type}-${r.id}`
}

export function isDraftDirty(
  current: ComposeDraft,
  initial: ComposeDraft = EMPTY_DRAFT
): boolean {
  if (current.subject !== initial.subject) return true
  if (current.content !== initial.content) return true
  if (current.recipients.length !== initial.recipients.length) return true
  const before = new Set(initial.recipients.map(recipientKey))
  return current.recipients.some((r) => !before.has(recipientKey(r)))
}

export function isDraftEmpty(draft: ComposeDraft): boolean {
  return (
    draft.recipients.length === 0 &&
    !draft.subject.trim() &&
    !draft.content.trim()
  )
}
