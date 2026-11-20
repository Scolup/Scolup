import { useCallback, useEffect, useRef, useState } from "react"
import { isPronote } from "@/services/litenote"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"

import { useLiveRefresh } from "@/hooks/useLiveRefresh"
import { MESSAGE_YEAR } from "../schoolYear"
import { toLists } from "../mappers"
import { emptyMessageFolders } from "../folders"
import {
  extractAttachments,
  messageBody,
  senderOf,
  toMessage,
} from "../mappers"
import { type FolderKey, type Message, type MessageEntry } from "../types"

export function useMessages() {
  const [folderMessages, setFolderMessages] =
    useState<Record<FolderKey, Message[]>>(emptyMessageFolders)
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const liveMessages = useLiveRefresh("messages")
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const pronote = isPronote()
        if (!pronote && !(await ld.auth.loadSession()))
          throw new Error("Aucune session active. Reconnecte-toi.")
        if (cancelled) return
        setSessionReady(true)
        const lists = pronote
          ? await (await import("../pronoteMessages")).fetchPronoteMessages()
          : toLists(
              (await ld.messages.getMessages({ year: MESSAGE_YEAR })).messages
            )
        if (cancelled) return
        loaded.current = true
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
  folder: FolderKey
}) {
  const [selected, setSelected] = useState<Message | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const suppressedIdRef = useRef<number | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentRefreshing, setContentRefreshing] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const { messageParam, sessionReady, folderMessages, folder } = opts

  const openMessage = useCallback(async (targetId: number, base?: Message) => {
    if (selectedIdRef.current === targetId) return
    if (suppressedIdRef.current === targetId) suppressedIdRef.current = null
    selectedIdRef.current = targetId
    if (base) setSelected(base)
    setContentError(null)

    const hadContent = Boolean(base?.body)

    setContentLoading(!hadContent)
    setContentRefreshing(hadContent)

    if (isPronote()) {
      try {
        if (!base) throw new Error("Message PRONOTE indisponible.")
        const updated = await (
          await import("../pronoteMessages")
        ).openPronoteMessage(base)
        if (selectedIdRef.current === targetId) setSelected(updated)
      } catch (err) {
        if (selectedIdRef.current === targetId)
          setContentError(
            errorMessage(err, "Impossible de charger ce message.")
          )
      } finally {
        if (selectedIdRef.current === targetId) {
          setContentLoading(false)
          setContentRefreshing(false)
        }
      }
      return
    }

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
        const wasUnread = base
          ? !base.sent && Boolean(base.unread)
          : !detailEntry.read
        if (wasUnread) {
          // getMessage already marks the message read server-side; markAsRead
          // also patches Litedirecte's cached lists so the inbox and badge
          // don't show it unread again until the next poll.
          void ld.messages
            .markAsRead(targetId, { year: MESSAGE_YEAR })
            .catch(() => {})
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
              to: detailEntry.to,
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

    const found =
      folderMessages[folder].find((m) => m.id === targetId) ??
      Object.values(folderMessages)
        .flat()
        .find((m) => m.id === targetId)
    if (found) {
      void openMessage(found.id, found)
      return
    }

    if (!sessionReady || isPronote()) return
    void openMessage(targetId)
  }, [messageParam, sessionReady, folderMessages, folder, openMessage])

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
