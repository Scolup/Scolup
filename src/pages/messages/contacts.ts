import type { Message, Contact } from "./types"

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

function findContactForSender(
  sender: string | undefined,
  contacts: Contact[]
): Contact | undefined {
  if (!sender) return undefined
  const normalized = sender.trim().toLowerCase()
  if (!normalized) return undefined
  return contacts.find((c) => c.name.toLowerCase().includes(normalized))
}

export function resolveReplyRecipient(
  message: Message,
  contacts: Contact[]
): Contact | null {
  // L'ID expéditeur du payload répond toujours, même quand le
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
