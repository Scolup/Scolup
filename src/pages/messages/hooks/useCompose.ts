import { useCallback, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight, triggerHapticMedium } from "@/services/haptics"
import {
  buildReplyBody,
  buildReplySubject,
  resolveReplyRecipient,
  toMessageHtml,
  validateCompose,
  type Contact,
  type Message,
} from "../helpers"

export type ComposeMode = "new" | "reply"

export type ComposeStep = 1 | 2

export function useCompose(onSent?: () => void) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ComposeMode>("new")
  const [step, setStep] = useState<ComposeStep>(1)
  const [replySender, setReplySender] = useState<string | undefined>(undefined)
  const [recipients, setRecipients] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const reset = useCallback(() => {
    setMode("new")
    setStep(1)
    setReplySender(undefined)
    setRecipients([])
    setSearch("")
    setSubject("")
    setContent("")
    setAttachments([])
    setSending(false)
    setError(null)
    setSent(false)
  }, [])

  const openNew = useCallback(() => {
    reset()
    triggerHapticLight()
    setOpen(true)
  }, [reset])

  const openReply = useCallback(
    (message: Message, contacts: Contact[]) => {
      reset()
      const resolved = resolveReplyRecipient(message, contacts)
      const nextRecipients = resolved ? [resolved] : []
      const nextSubject = buildReplySubject(message.subject)
      const nextBody = buildReplyBody(message)
      setRecipients(nextRecipients)
      // ponytail: sans destinataire résolu (ni ID ni nom connu),
      // on pré-remplit la recherche pour une sélection manuelle en un tap.
      setSearch(resolved ? "" : (message.sender ?? ""))
      setSubject(nextSubject)
      setContent(nextBody)
      setStep(resolved ? 2 : 1)
      setMode("reply")
      setReplySender(message.sender)
      triggerHapticLight()
      setOpen(true)
    },
    [reset]
  )

  const requestClose = useCallback(() => {
    if (sending) return
    reset()
    setOpen(false)
  }, [sending, reset])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const discardDraft = useCallback(() => {
    reset()
    setOpen(false)
  }, [reset])

  const toggleRecipient = useCallback((contact: Contact) => {
    triggerHapticLight()
    setRecipients((prev) =>
      prev.some((r) => r.id === contact.id && r.type === contact.type)
        ? prev.filter((r) => !(r.id === contact.id && r.type === contact.type))
        : [...prev, contact]
    )
  }, [])

  const addAttachments = useCallback((files: FileList | File[]) => {
    const picked = Array.from(files).filter((f) => f.size > 0)
    if (picked.length === 0) return
    setAttachments((prev) => [...prev, ...picked])
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const send = useCallback(async () => {
    const validation = validateCompose(recipients, subject, content)
    if (validation) {
      setError(validation)
      return
    }
    setSending(true)
    setError(null)
    try {
      // ponytail: téléversement à l'envoi, pas à la sélection — le `unc`
      // temporaire est consommé par l'envoi qui suit, aucun état à garder.
      const files: { unc: string; libelle: string }[] = []
      for (const file of attachments) {
        try {
          files.push(await ld.messages.uploadAttachment(file))
        } catch {
          setError(
            `Impossible de téléverser « ${file.name} ». Vérifie ta connexion et réessaie.`
          )
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
      setSent(true)
      onSent?.()
    } catch (err) {
      setError(errorMessage(err, "Impossible d'envoyer ce message."))
    } finally {
      setSending(false)
    }
  }, [recipients, subject, content, attachments, onSent])

  return {
    open,
    mode,
    step,
    setStep,
    replySender,
    recipients,
    search,
    setSearch,
    subject,
    setSubject,
    content,
    setContent,
    attachments,
    addAttachments,
    removeAttachment,
    sending,
    error,
    sent,
    openNew,
    openReply,
    requestClose,
    discardDraft,
    toggleRecipient,
    send,
    clearError,
    reset,
  }
}

export type ComposeState = ReturnType<typeof useCompose>
