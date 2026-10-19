import { useCallback, useEffect, useRef, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"

import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { MESSAGE_YEAR, toLists } from "../helpers"
import {
  extractAttachments,
  messageBody,
  senderOf,
  toMessage,
  type FolderKey,
  type Message,
  type MessageEntry,
} from "../helpers"

export function useMessages() {
  const [folderMessages, setFolderMessages] = useState<
    Record<FolderKey, Message[]>
  >({
    inbox: [],
    sent: [],
  })
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const liveMessages = useLiveRefresh("messages")
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const restored = await ld.auth.loadSession()
      if (cancelled) return
      if (!restored) {
        setError("Aucune session active. Reconnecte-toi.")
        setLoading(false)
        return
      }
      setSessionReady(true)

      try {
        const result = await ld.messages.getMessages({ year: MESSAGE_YEAR })
        if (cancelled) return
        loaded.current = true
        const lists = toLists(result.messages)
        setFolderMessages(lists)
        setError(null)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        // A failed refresh leaves the loaded lists in place; only a first load
        // with nothing on screen reports the error.
        if (!loaded.current) {
          setError(errorMessage(err, "Impossible de charger les messages."))
        }
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey, liveMessages])

  return {
    folderMessages,
    setFolderMessages,
    loading,
    sessionReady,
    error,
    setError,
    setLoading,
    reloadKey,
    setReloadKey,
  }
}

export function useRestoreSelectedMessage(opts: {
  messageParam: string | null
  sessionReady: boolean
  folderMessages: Record<FolderKey, Message[]>
}) {
  const [selected, setSelected] = useState<Message | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const suppressedIdRef = useRef<number | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentRefreshing, setContentRefreshing] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const { messageParam, sessionReady, folderMessages } = opts

  const openMessage = useCallback(async (targetId: number, base?: Message) => {
    if (selectedIdRef.current === targetId) return
    if (suppressedIdRef.current === targetId) suppressedIdRef.current = null
    selectedIdRef.current = targetId
    if (base) setSelected(base)
    setContentError(null)

    const hadContent = Boolean(base?.body)

    setContentLoading(!hadContent)
    setContentRefreshing(hadContent)

    ld.messages
      .getMessage(targetId, {
        year: MESSAGE_YEAR,
        mode: base?.sent ? "expediteur" : "destinataire",
      })
      .then((detail) => {
        const detailEntry = detail as MessageEntry
        const detailedAttachments = Array.isArray(detailEntry.files)
          ? extractAttachments(detailEntry.files as unknown[])
          : undefined
        const detailSender = senderOf(detailEntry)
        const senderPatch = {
          ...(detailSender ? { senderId: detailSender.id } : {}),
          ...(detailSender?.type ? { senderType: detailSender.type } : {}),
        }
        const updated: Message = base
          ? {
              ...base,
              ...senderPatch,
              body: messageBody(detail),
              unread: !detailEntry.read,
              ...(detailedAttachments?.length
                ? { attachments: detailedAttachments, hasAttachment: true }
                : {}),
            }
          : toMessage({
              id: targetId,
              subject: detailEntry.subject,
              contenu: messageBody(detailEntry),
              date: detailEntry.date,
              read: detailEntry.read,
              files: detailEntry.files,
              fromName: detailEntry.fromName,
              from: detailEntry.from,
            })
        if (selectedIdRef.current === targetId) setSelected(updated)
      })
      .catch((err) => {
        if (!hadContent && selectedIdRef.current === targetId) {
          setContentError(
            errorMessage(err, "Impossible de charger ce message.")
          )
        }
      })
      .finally(() => {
        if (selectedIdRef.current === targetId) {
          setContentLoading(false)
          setContentRefreshing(false)
        }
      })
  }, [])

  const dismissSelected = useCallback(() => {
    suppressedIdRef.current = selectedIdRef.current
    selectedIdRef.current = null
    setSelected(null)
    setContentLoading(false)
    setContentRefreshing(false)
    setContentError(null)
  }, [])

  useEffect(() => {
    if (!messageParam) {
      suppressedIdRef.current = null
      if (selectedIdRef.current !== null) {
        selectedIdRef.current = null
        setSelected(null)
        setContentLoading(false)
        setContentRefreshing(false)
        setContentError(null)
      }
      return
    }
    const targetId = Number(messageParam)
    if (Number.isNaN(targetId)) return
    if (targetId === suppressedIdRef.current) return
    if (selectedIdRef.current === targetId) return

    const allMessages: Message[] = Object.values(folderMessages).flat()
    const found = allMessages.find((m) => m.id === targetId)
    if (found) {
      void openMessage(found.id, found)
      return
    }

    if (!sessionReady) return
    void openMessage(targetId)
  }, [messageParam, sessionReady, folderMessages, openMessage])

  const displaySelected =
    selected ??
    (contentLoading && selectedIdRef.current !== null
      ? { id: selectedIdRef.current }
      : null)

  return {
    selected: displaySelected,
    setSelected,
    selectedIdRef,
    contentLoading,
    setContentLoading,
    contentRefreshing,
    contentError,
    setContentError,
    openMessage,
    dismissSelected,
  }
}
