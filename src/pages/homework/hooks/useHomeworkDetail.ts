"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { mergeDayDetails, normalizeCalendar } from "../helpers"
import type { Assignment, AssignmentsSetter } from "../helpers"

export function useHomeworkDetail(
  assignments: Assignment[],
  setAssignments: AssignmentsSetter
) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [detail, setDetail] = useState<Assignment | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailRetryKey, setDetailRetryKey] = useState(0)
  const fetchedDaysRef = useRef<Set<string> | null>(null)
  if (fetchedDaysRef.current === null) fetchedDaysRef.current = new Set()
  const fetchedDays = fetchedDaysRef.current

  const selected = useMemo(
    () => assignments.find((a) => a.key === selectedKey) ?? null,
    [assignments, selectedKey]
  )

  useEffect(() => {
    if (!selected) {
      setDetail(null)
      setDetailError(null)
      setDetailLoading(false)
      return
    }
    if (selected.content !== undefined) {
      setDetail(selected)
      setDetailError(null)
      setDetailLoading(false)
      return
    }
    if (fetchedDays.has(selected.dueKey)) {
      setDetail(selected)
      setDetailError(null)
      setDetailLoading(false)
      return
    }
    let cancelled = false
    setDetail(selected)
    setDetailLoading(true)
    setDetailError(null)
    ;(async () => {
      try {
        const raw = (await ld.homework.getHomeworkForDate(
          selected.dueKey
        )) as unknown
        if (cancelled) return
        const list = Array.isArray((raw as { matieres?: unknown }).matieres)
          ? (raw as { matieres: unknown[] }).matieres
          : Array.isArray((raw as { subjects?: unknown }).subjects)
            ? (raw as { subjects: unknown[] }).subjects
            : Array.isArray(raw)
              ? raw
              : []
        const parsed = normalizeCalendar({ [selected.dueKey]: list })
        const found =
          parsed.find((a) => a.id === selected.id) ?? parsed[0] ?? null
        fetchedDays.add(selected.dueKey)
        setAssignments((prev) => mergeDayDetails(prev, selected.dueKey, parsed))
        if (!found || found.content === undefined) {
          setDetail(selected)
        } else {
          setDetail({
            ...selected,
            content: found.content,
            documents: found.documents,
            comments: found.comments,
            givenOn: found.givenOn ?? selected.givenOn,
            teacher: selected.teacher ?? found.teacher,
          })
        }
      } catch (err) {
        if (cancelled) return
        setDetailError(errorMessage(err, "Impossible de charger ce devoir."))
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selected?.key,
    selected?.dueKey,
    selected?.id,
    detailRetryKey,
    setAssignments,
    fetchedDays,
  ])

  const liveDetail =
    detail && selected && detail.key === selected.key
      ? { ...detail, done: selected.done, comments: selected.comments }
      : detail

  return {
    selected,
    detail: liveDetail,
    detailLoading,
    detailError,
    retryDetail: () => setDetailRetryKey((key) => key + 1),
    clearDetailCache: () => fetchedDays.clear(),
    selectAssignment: (assignment: Assignment) =>
      setSelectedKey(assignment.key),
    closeDetail: () => setSelectedKey(null),
  }
}
