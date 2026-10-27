"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { getSetting } from "@/services/storage"
import { addDays, parseDateKey, toDayKey, weekOf } from "@/services/dates"
import { triggerHapticLight } from "@/services/haptics"
import { track } from "@/services/quests"
import { coursesForDay, type AgendaView, type Course } from "../helpers"
import { useAgenda } from "./useAgenda"

const SWIPE_PX = 60

function useStoredWeekView(
  params: URLSearchParams,
  setParams: (p: URLSearchParams) => void
) {
  const hasVue = params.has("vue")

  useEffect(() => {
    if (hasVue) return
    void getSetting("agendaView").then((stored) => {
      if (stored !== "week") return
      const next = new URLSearchParams(params.toString())
      next.set("vue", "semaine")
      setParams(next)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore the stored default once
  }, [hasVue])
}

export function useAgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [navDir, setNavDir] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  // True when the drawer was opened in-session (push): closing it then goes
  // back instead of replacing, so Android's back button closes the drawer
  // first. Deep links (?cours= opened directly) still close via replace.
  const pushedDrawer = useRef(false)

  const dateParam = searchParams.get("date")
  const date = useMemo(() => parseDateKey(dateParam) ?? new Date(), [dateParam])
  const view: AgendaView =
    searchParams.get("vue") === "semaine" ? "week" : "day"
  const courseParam = searchParams.get("cours")

  const week = weekOf(date)
  const startKey = toDayKey(week[0])
  const endKey = toDayKey(week[6])

  const { courses, loading, error, refresh } = useAgenda(startKey, endKey)

  useEffect(() => {
    void track("agenda-viewed")
  }, [])

  const sorted = useMemo(
    () =>
      [...courses].sort(
        (a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0)
      ),
    [courses]
  )
  const dayCourses = coursesForDay(sorted, toDayKey(date))
  const weekCourses = useMemo(
    () =>
      sorted.filter((c) => {
        if (!c.start) return false
        const key = toDayKey(c.start)
        return key >= startKey && key <= endKey
      }),
    [sorted, startKey, endKey]
  )

  const selected = useMemo(
    () =>
      courseParam
        ? (sorted.find((c) => c.stableId === courseParam) ?? null)
        : null,
    [sorted, courseParam]
  )

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setDate = useCallback(
    (next: Date, dir?: number) => {
      const current = toDayKey(date)
      const target = toDayKey(next)
      if (target !== current) triggerHapticLight()
      setNavDir(dir ?? (target > current ? 1 : target < current ? -1 : 0))
      // Changing day drops the drawer state, including its history entry.
      pushedDrawer.current = false
      commit((params) => {
        if (target === toDayKey(new Date())) params.delete("date")
        else params.set("date", target)
        params.delete("cours")
      })
    },
    [date, commit]
  )

  const setView = useCallback(
    (next: AgendaView) => {
      if (next === view) return
      triggerHapticLight()
      commit((params) => {
        if (next === "week") params.set("vue", "semaine")
        else params.delete("vue")
      })
    },
    [commit, view]
  )

  const select = useCallback(
    (course: Course | null) => {
      if (course) {
        if (course.stableId !== courseParam) triggerHapticLight()
        pushedDrawer.current = true
        const params = new URLSearchParams(searchParams.toString())
        params.set("cours", course.stableId)
        setSearchParams(params)
        return
      }
      if (pushedDrawer.current) {
        pushedDrawer.current = false
        navigate(-1)
        return
      }
      commit((params) => {
        params.delete("cours")
      })
    },
    [commit, courseParam, navigate, searchParams, setSearchParams]
  )

  useStoredWeekView(
    searchParams,
    useCallback(
      (params) => setSearchParams(params, { replace: true }),
      [setSearchParams]
    )
  )

  const step = useCallback(
    (delta: number) =>
      setDate(addDays(date, view === "week" ? delta * 7 : delta), delta),
    [date, view, setDate]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        step(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        step(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step])

  const swipe = useMemo(
    () => ({
      onTouchStart: (e: React.TouchEvent) => {
        touchStart.current =
          e.touches.length === 1
            ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
            : null
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const origin = touchStart.current
        touchStart.current = null
        if (!origin) return
        const touch = e.changedTouches[0]
        const dx = touch.clientX - origin.x
        const dy = touch.clientY - origin.y
        if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.4) return
        step(dx < 0 ? 1 : -1)
      },
    }),
    [step]
  )

  return {
    date,
    view,
    navDir,
    dayCourses,
    weekCourses,
    visible: view === "week" ? weekCourses : dayCourses,
    selected,
    loading,
    error,
    refresh,
    setDate,
    setView,
    select,
    swipe,
  }
}
