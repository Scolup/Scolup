import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight } from "@/services/haptics"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { isPronote } from "@/services/litenote"
import { buildPagination, PAGE_SIZE } from "../pagination"
import {
  countUnreadMessages,
  parseFolderParam,
  serializeFolderParam,
} from "../folders"
import { MESSAGE_YEAR } from "../schoolYear"
import { type FolderKey, type Message } from "../types"
import { useMessages, useRestoreSelectedMessage } from "./useMessages"
import { setUnreadMessagesCount } from "../unreadCount"

const UNREAD_PAGINATION_SLOTS = 9
const COMPACT_PAGINATION_SLOTS = 5
const SEARCH_DEBOUNCE_MS = 300

function matchesSearch(message: Message, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return [
    message.sender,
    message.recipients?.join(" "),
    message.subject,
    message.body,
  ].some((field) => field?.toLowerCase().includes(normalized))
}

export function useMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(() => searchParams.get("search") ?? "")
  const [actionError, setActionError] = useState<string | null>(null)
  // Same pattern as the agenda drawer: push on open so Android back closes
  // the message first, navigate(-1) on close, replace for deep links.
  const pushedDrawer = useRef(false)

  const urlSearch = searchParams.get("search") ?? ""
  const requestedPage = Number(searchParams.get("page")) || 1
  const pronote = isPronote()
  const folder = parseFolderParam(searchParams.get("folder"), pronote)
  const messageParam = searchParams.get("message")

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    setInput(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    if (input === urlSearch) return
    const timer = setTimeout(() => {
      commit((params) => {
        if (input) params.set("search", input)
        else params.delete("search")
        params.delete("page")
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, urlSearch, commit])

  const store = useMessages()
  const detail = useRestoreSelectedMessage({
    messageParam,
    sessionReady: store.sessionReady,
    folderMessages: store.folderMessages,
    folder,
  })

  const { folderMessages, loading, setFolderMessages } = store
  const activeMessages = folderMessages[folder]

  const setActiveMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      store.setFolderMessages((prev) => ({
        ...prev,
        [folder]: updater(prev[folder] ?? []),
      }))
    },
    [folder, store.setFolderMessages]
  )

  useEffect(() => {
    if (loading) return
    setUnreadMessagesCount(countUnreadMessages(folderMessages.inbox))
  }, [loading, folderMessages])

  const selectedId = detail.selected?.draft
    ? null
    : (detail.selected?.id ?? null)
  useEffect(() => {
    if (typeof selectedId !== "number") return
    setFolderMessages((previous) => {
      let next = previous
      for (const key of Object.keys(previous) as FolderKey[]) {
        if (
          !previous[key].some(
            (message) => message.id === selectedId && message.unread
          )
        )
          continue
        if (next === previous) next = { ...previous }
        next[key] = previous[key].map((message) =>
          message.id === selectedId ? { ...message, unread: false } : message
        )
      }
      return next
    })
    // A live refresh can land while the message is open with the cached list
    // still saying unread: re-apply the read state whenever that list changes.
  }, [selectedId, folderMessages, setFolderMessages])

  const query = input
  const filteredMessages = useMemo(
    () =>
      activeMessages
        .filter((message) => message.subject !== "[Message supprimé.]")
        .filter((message) => matchesSearch(message, query))
        .sort((a, b) => (b.time?.getTime() ?? 0) - (a.time?.getTime() ?? 0)),
    [activeMessages, query]
  )

  const unreadMessages = useMemo(
    () =>
      query.trim() ? [] : filteredMessages.filter((message) => message.unread),
    [filteredMessages, query]
  )
  const listMessages =
    unreadMessages.length > 0
      ? filteredMessages.filter((message) => !message.unread)
      : filteredMessages

  const totalPages = Math.max(1, Math.ceil(listMessages.length / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)
  const slots = useMediaQuery("(min-width: 768px)")
    ? UNREAD_PAGINATION_SLOTS
    : COMPACT_PAGINATION_SLOTS
  const pagination = buildPagination(totalPages, currentPage, slots)

  const selectMessage = useCallback(
    (message: Message) => {
      triggerHapticLight()
      pushedDrawer.current = true
      const params = new URLSearchParams(searchParams.toString())
      params.set("message", String(message.id))
      setSearchParams(params)
      detail.openMessage(message.id, message)
    },
    [searchParams, setSearchParams, detail]
  )

  const closeMessage = useCallback(() => {
    detail.dismissSelected()
    if (pushedDrawer.current) {
      pushedDrawer.current = false
      navigate(-1)
      return
    }
    commit((params) => params.delete("message"))
  }, [commit, detail, navigate])

  return {
    folder,
    query,
    setQuery: setInput,
    loading: store.loading,
    error: store.error,
    retry: () => {
      store.setError(null)
      store.setLoading(true)
      store.setReloadKey((key) => key + 1)
    },
    messages: filteredMessages,
    unreadMessages,
    showUnreadHighlights: unreadMessages.length > 0 && requestedPage === 1,
    pageMessages: listMessages.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    ),
    requestedPage,
    currentPage,
    totalPages,
    ...pagination,
    setFolder: (value: FolderKey) => {
      if (value !== folder) triggerHapticLight()
      detail.dismissSelected()
      pushedDrawer.current = false
      commit((params) => {
        const serialized = serializeFolderParam(value, pronote)
        if (serialized) params.set("folder", serialized)
        else params.delete("folder")
        params.delete("page")
        params.delete("message")
      })
    },
    setPage: (value: number) => {
      if (value !== currentPage) triggerHapticLight()
      commit((params) => {
        if (value > 1) params.set("page", String(value))
        else params.delete("page")
      })
    },
    selected: detail.selected,
    selectMessage,
    closeMessage,
    retrySelected: () => {
      if (detail.selected) selectMessage(detail.selected)
    },
    markUnread: (message: Message) => {
      closeMessage()
      setActionError(null)
      setActiveMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, unread: true } : m))
      )
      ld.messages
        .markAsUnread(message.id, { year: MESSAGE_YEAR })
        .then(() => triggerHapticLight())
        .catch((err) => {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === message.id ? { ...m, unread: false } : m))
          )
          setActionError(
            errorMessage(err, "Impossible de marquer ce message comme non lu.")
          )
        })
    },
    actionError,
    dismissActionError: () => setActionError(null),
    contentLoading: detail.contentLoading,
    contentRefreshing: detail.contentRefreshing,
    contentError: detail.contentError,
  }
}
