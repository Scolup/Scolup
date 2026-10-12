import { useCallback, useEffect, useState } from "react"
import { ld } from "@/services/linkdirecte"
import { errorMessage } from "@/services/errors"

import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { normalizeTimetable } from "../helpers"
import { addDays, parseDateKey, toDayKey } from "@/services/dates"
import { ensureSubjects, resolveSubjectColor } from "@/services/subjects"
import type { Course } from "../helpers"

const weekCache = new Map<string, Course[]>()
const fetchedWeeks = new Set<string>()
const failedWeeks = new Set<string>()
const inflight = new Map<string, Promise<Course[]>>()

async function fetchWeek(startKey: string, endKey: string): Promise<Course[]> {
  const cached = inflight.get(startKey)
  if (cached) return cached
  const promise = (async () => {
    const restored = await ld.auth.loadSession()
    if (!restored) throw new Error("Aucune session active. Reconnecte-toi.")
    const payload = await ld.timetable.getTimetable({
      startDate: startKey,
      endDate: endKey,
    })
    // No `force`: on a live refresh the poll has just rewritten this entry, so
    // the cached read is free and still current.
    const list = normalizeTimetable(payload)
    void ensureSubjects(
      list.map((course) => ({
        code: course.subjectCode,
        name: course.title,
      }))
    )
    return list.map((course) => ({
      ...course,
      color: resolveSubjectColor(course.subjectCode, course.title),
    }))
  })()
  inflight.set(startKey, promise)
  try {
    const list = await promise
    weekCache.set(startKey, list)
    fetchedWeeks.add(startKey)
    failedWeeks.delete(startKey)
    return list
  } catch (err) {
    failedWeeks.add(startKey)
    throw err
  } finally {
    inflight.delete(startKey)
  }
}

function neighborKeys(startKey: string): Array<{ start: string; end: string }> {
  const monday = parseDateKey(startKey)
  if (!monday) return []
  const prevMonday = addDays(monday, -7)
  const nextMonday = addDays(monday, 7)
  return [
    { start: toDayKey(prevMonday), end: toDayKey(addDays(prevMonday, 6)) },
    { start: toDayKey(nextMonday), end: toDayKey(addDays(nextMonday, 6)) },
  ]
}

export function useAgenda(startKey: string, endKey: string) {
  const [courses, setCourses] = useState<Course[]>(
    () => weekCache.get(startKey) ?? []
  )
  const [loading, setLoading] = useState(() => !weekCache.has(startKey))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedSnapshot, setFailedSnapshot] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const liveTimetable = useLiveRefresh("timetable")

  useEffect(() => {
    let cancelled = false
    const hadCache = weekCache.has(startKey)
    if (!hadCache) {
      setLoading(true)
      setCourses([])
    } else {
      setCourses(weekCache.get(startKey) ?? [])
      setRefreshing(true)
    }
    setError(null)

    ;(async () => {
      try {
        const list = await fetchWeek(startKey, endKey)
        if (cancelled) return
        setCourses(list)
        setError(null)
      } catch (err) {
        if (cancelled) return
        const fallback = weekCache.get(startKey)
        if (fallback && fallback.length > 0) {
          setCourses(fallback)
          setError(null)
        } else {
          setCourses([])
          setError(
            errorMessage(err, "Impossible de charger l'emploi du temps.")
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
          setFailedSnapshot([...failedWeeks])
        }
      }
    })()

    const prefetchTimer = setTimeout(() => {
      if (cancelled) return
      for (const n of neighborKeys(startKey)) {
        if (fetchedWeeks.has(n.start) || inflight.has(n.start)) continue
        fetchWeek(n.start, n.end).catch(() => {})
      }
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(prefetchTimer)
    }
  }, [startKey, endKey, reloadKey, liveTimetable])

  const refresh = useCallback(() => {
    fetchedWeeks.delete(startKey)
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [startKey])

  return {
    courses,
    loading,
    refreshing,
    error,
    failedWeeks: failedSnapshot,
    setError,
    setLoading,
    setReloadKey,
    refresh,
  }
}
