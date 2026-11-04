export type FolderKey = "inbox" | "sent"

export interface Attachment {
  id: number
  name: string
  type: string
}

interface MessageRecipient {
  name?: string
  civilite?: string
  prenom?: string
  nom?: string
  role?: string
  id?: number | string
}

export interface Message {
  id: number
  sender?: string
  senderId?: number
  senderType?: string
  recipients?: string[]
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
  to?: MessageRecipient[]
  date?: Date
  files?: unknown[]
  read?: boolean
  message?: { contenu?: string }
}

export interface Contact {
  id: number
  type: string
  name: string
  detail?: string
  raw: unknown
}

export interface SenderRef {
  id: number
  type?: string
}
