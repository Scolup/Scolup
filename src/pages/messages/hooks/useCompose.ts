import { useCallback, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight, triggerHapticMedium } from "@/services/haptics"
import {
  buildReplyBody,
  buildReplySubject,
  toMessageHtml,
  validateCompose,
} from "../compose"
import { resolveReplyRecipient } from "../contacts"
import { type Contact, type Message } from "../types"

type ComposeMode = "new" | "reply"

type ComposeStep = 1 | 2

// Tout ce qui change pendant l'écriture d'un message.
interface Draft {
  mode: ComposeMode
  step: ComposeStep
  replySender: string | undefined
  recipients: Contact[]
  search: string
  subject: string
  content: string
  attachments: File[]
  sending: boolean
  error: string | null
  sent: boolean
}

const EMPTY_DRAFT: Draft = {
  mode: "new",
  step: 1,
  replySender: undefined,
  recipients: [],
  search: "",
  subject: "",
  content: "",
  attachments: [],
  sending: false,
  error: null,
  sent: false,
}

export function useCompose(onSent?: () => void) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  // Modifie quelques champs du brouillon sans toucher aux autres.
  const update = useCallback((changes: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...changes }))
  }, [])

  const reset = useCallback(() => setDraft(EMPTY_DRAFT), [])

  const openNew = useCallback(() => {
    reset()
    triggerHapticLight()
    setOpen(true)
  }, [reset])

  const openReply = useCallback((message: Message, contacts: Contact[]) => {
    const resolved = resolveReplyRecipient(message, contacts)
    setDraft({
      ...EMPTY_DRAFT,
      mode: "reply",
      // Destinataire connu : on passe directement à l'écriture.
      step: resolved ? 2 : 1,
      recipients: resolved ? [resolved] : [],
      // NOTE : sans destinataire résolu (ni ID ni nom connu), on pré-remplit la
      // recherche pour une sélection manuelle en un tap.
      search: resolved ? "" : (message.sender ?? ""),
      subject: buildReplySubject(message.subject),
      content: buildReplyBody(message),
      replySender: message.sender,
    })
    triggerHapticLight()
    setOpen(true)
  }, [])

  const requestClose = useCallback(() => {
    if (draft.sending) return
    reset()
    setOpen(false)
  }, [draft.sending, reset])

  const discardDraft = useCallback(() => {
    reset()
    setOpen(false)
  }, [reset])

  const toggleRecipient = useCallback((contact: Contact) => {
    triggerHapticLight()
    const isSame = (r: Contact) =>
      r.id === contact.id && r.type === contact.type
    setDraft((current) => ({
      ...current,
      recipients: current.recipients.some(isSame)
        ? current.recipients.filter((r) => !isSame(r))
        : [...current.recipients, contact],
    }))
  }, [])

  const addAttachments = useCallback((files: FileList | File[]) => {
    const picked = Array.from(files).filter((f) => f.size > 0)
    if (picked.length === 0) return
    setDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...picked],
    }))
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((_, i) => i !== index),
    }))
  }, [])

  const send = useCallback(async () => {
    const { recipients, subject, content, attachments } = draft
    const validation = validateCompose(recipients, subject, content)
    if (validation) {
      update({ error: validation })
      return
    }
    update({ sending: true, error: null })
    try {
      // On téléverse les pièces jointes à l'envoi, pas à la sélection : le
      // `unc` temporaire est consommé par l'envoi qui suit, aucun état à garder.
      const files: { unc: string; libelle: string }[] = []
      for (const file of attachments) {
        try {
          files.push(await ld.messages.uploadAttachment(file))
        } catch {
          update({
            error: `Impossible de téléverser « ${file.name} ». Vérifie ta connexion et réessaie.`,
          })
          return
        }
      }
      await ld.messages.sendMessage({
        subject: subject.trim(),
        content: toMessageHtml(content),
        destinataires: recipients.map((r) => r.raw),
        files,
      })
      triggerHapticMedium()
      update({ sent: true })
      onSent?.()
    } catch (err) {
      update({ error: errorMessage(err, "Impossible d'envoyer ce message.") })
    } finally {
      update({ sending: false })
    }
  }, [draft, update, onSent])

  return {
    open,
    ...draft,
    setStep: useCallback((step: ComposeStep) => update({ step }), [update]),
    setSearch: useCallback((search: string) => update({ search }), [update]),
    setSubject: useCallback((subject: string) => update({ subject }), [update]),
    setContent: useCallback((content: string) => update({ content }), [update]),
    addAttachments,
    removeAttachment,
    openNew,
    openReply,
    requestClose,
    discardDraft,
    toggleRecipient,
    send,
    clearError: useCallback(() => update({ error: null }), [update]),
    reset,
  }
}

export type ComposeState = ReturnType<typeof useCompose>
