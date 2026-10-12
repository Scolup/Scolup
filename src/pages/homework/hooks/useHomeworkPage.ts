"use client"

import { useCallback, useEffect, useMemo } from "react"
import { markSeen } from "@/services/storage"
import { groupByDay } from "../helpers"
import { useHomework, useToggleDone } from "./useHomework"
import { useHomeworkComment } from "./useHomeworkComment"
import { useHomeworkDetail } from "./useHomeworkDetail"

export function useHomeworkPage() {
  const store = useHomework()
  const toggle = useToggleDone(store.setAssignments)
  const comment = useHomeworkComment(store.setAssignments)
  const detail = useHomeworkDetail(store.assignments, store.setAssignments)

  const groups = useMemo(
    () => groupByDay(store.assignments),
    [store.assignments]
  )

  const retry = useCallback(() => {
    store.setError(null)
    store.setLoading(true)
    detail.clearDetailCache()
    store.setReloadKey((key) => key + 1)
  }, [store, detail])

  useEffect(() => {
    void markSeen("homework")
  }, [])

  return {
    groups,
    loading: store.loading,
    error: store.error,
    retry,
    toggle: toggle.toggle,
    togglePending: toggle.pending,
    toggleError: toggle.toggleError,
    dismissToggleError: toggle.setToggleError,
    comment,
    detail,
  }
}
