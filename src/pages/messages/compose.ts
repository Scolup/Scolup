import { htmlToText } from "@/lib/html"
import type { Message, Contact } from "./types"
import { formatFullDate } from "./format"

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function toMessageHtml(content: string): string {
  // L'encodage des accents en entités vit dans Litedirecte (sendMessage) :
  // tous ses consommateurs en profitent, pas seulement Scolup.
  return escapeHtml(content.trim()).replace(/\n/g, "<br>")
}

export const MAX_SUBJECT_LENGTH = 120
