"use client"

import { useEffect, useState } from "react"
import { getFriendlyErrorMessage } from "litedirecte"
import { ld } from "@/services/litedirecte"
import { toDayKey } from "@/services/dates"
import type { Course } from "../helpers"
import type { HomeworkDocument } from "@/pages/homework/helpers"

export interface SessionContent {
  html?: string
  documents: HomeworkDocument[]
}

const dayCache = new Map<string, Array<Record<string, unknown>>>()
const inflight = new Map<string, Promise<Array<Record<string, unknown>>>>()

function entriesOf(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    for (const key of ["matieres", "subjects"]) {
      if (Array.isArray(record[key]))
        return record[key] as Array<Record<string, unknown>>
    }
  }
  return []
}

function toDocuments(files: unknown): HomeworkDocument[] {
  if (!Array.isArray(files)) return []
  return (files as Array<Record<string, unknown>>)
    .map((file): HomeworkDocument | null => {
      if (typeof file?.libelle !== "string" || !file.libelle) return null
      const id = Number(file.id)
      return {
        id: Number.isFinite(id) ? id : 0,
        name: file.libelle,
        type: typeof file.type === "string" ? file.type : "FICHIER_CDT",
        size: typeof file.taille === "number" ? file.taille : undefined,
      }
    })
    .filter((file): file is HomeworkDocument => file !== null)
}

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

async function fetchDayEntries(dayKey: string) {
  const cached = inflight.get(dayKey)
  if (cached) return cached
  const promise = (async () => {
    const raw = (await ld.homework.getHomeworkForDate(dayKey)) as unknown
    const entries = entriesOf(raw)
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
        const entries = await fetchDayEntries(dayKey)
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
