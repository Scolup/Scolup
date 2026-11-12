import { toDocuments } from "@/pages/homework/mappers"
import { useEffect, useState } from "react"
import { getFriendlyErrorMessage } from "litedirecte"
import { fetchDayEntries } from "@/pages/homework/fetchDayEntries"
import { toDayKey } from "@/lib/dates"
import type { Course } from "../types"
import type { HomeworkDocument } from "@/pages/homework/types"

interface SessionContent {
  html?: string
  documents: HomeworkDocument[]
}

const dayCache = new Map<string, Array<Record<string, unknown>>>()
const inflight = new Map<string, Promise<Array<Record<string, unknown>>>>()

function matchesSubject(
  entry: Record<string, unknown>,
  code: string,
  title: string
): boolean {
  const entryCode =
    typeof entry.codeMatiere === "string"
      ? entry.codeMatiere.trim().toLowerCase()
      : ""
  if (code && entryCode) return entryCode === code
  const entryName =
    typeof entry.matiere === "string" ? entry.matiere.trim().toLowerCase() : ""
  return !!entryName && entryName === title
}

function toSession(
  entries: Array<Record<string, unknown>>,
  code: string,
  title: string
): SessionContent {
  const entry = entries.find((e) => matchesSubject(e, code, title))
  const detail = entry?.contenuDeSeance as Record<string, unknown> | undefined
  const html =
    typeof detail?.contenu === "string" && detail.contenu.trim()
      ? detail.contenu
      : undefined
  return { html, documents: toDocuments(detail?.documents) }
}

async function loadDay(dayKey: string) {
  const cached = inflight.get(dayKey)
  if (cached) return cached
  const promise = (async () => {
    const entries = await fetchDayEntries(dayKey)
    dayCache.set(dayKey, entries)
    return entries
  })()
  inflight.set(dayKey, promise)
  try {
    return await promise
  } finally {
    inflight.delete(dayKey)
  }
}

export function useSessionContent(course: Course | null) {
  const dayKey = course?.start ? toDayKey(course.start) : ""
  const code = course?.subjectCode?.trim().toLowerCase() ?? ""
  const title = course?.title.trim().toLowerCase() ?? ""

  const [session, setSession] = useState<SessionContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!dayKey) {
      setSession(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    const fastHit = dayCache.get(dayKey)
    if (fastHit) {
      setSession(toSession(fastHit, code, title))
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const entries = await loadDay(dayKey)
        if (cancelled) return
        setSession(toSession(entries, code, title))
      } catch (err) {
        if (cancelled) return
        const errCode = (err as { code?: string } | null)?.code
        setError(
          errCode
            ? getFriendlyErrorMessage(
                errCode,
                "Impossible de charger le contenu de séance."
              )
            : err instanceof Error
              ? err.message
              : "Impossible de charger le contenu de séance."
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dayKey, code, title, reloadKey])

  return {
    session,
    loading: !!dayKey && loading,
    error: dayKey ? error : null,
    retry: () => {
      dayCache.delete(dayKey)
      setReloadKey((key) => key + 1)
    },
  }
}
