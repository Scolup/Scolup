import { useCallback, useEffect, useRef, useState } from "react"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight } from "@/services/haptics"
import { toDayKey } from "@/services/dates"
import { syncHomework, track } from "@/services/quests"
import { subjectId } from "@/services/quest-rules"

import { normalizeCalendar, preserveEnrichedDetails } from "../helpers"
import { ensureSubjects, resolveSubjectColor } from "@/services/subjects"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import type { Assignment } from "../helpers"

export function useHomework() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const liveHomework = useLiveRefresh("homework")
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

      try {
        const fresh = await ld.homework.getHomework()
        if (cancelled) return
        const parsed = normalizeCalendar(fresh)
        await ensureSubjects(
          parsed.map((assignment) => ({
            code: assignment.subjectCode,
            name: assignment.subject,
          }))
        )
        if (cancelled) return
        const colored = parsed.map((assignment) => ({
          ...assignment,
          color: resolveSubjectColor(
            assignment.subjectCode,
            assignment.subject
          ),
        }))
        if (cancelled) return
        loaded.current = true
        // ponytail: the index is light (no contenu) and a background poll
        // would otherwise wipe details merged by getHomeworkForDate.
        setAssignments((prev) => preserveEnrichedDetails(prev, colored))
        void syncHomework(colored)
        setError(null)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setLoading(false)
        // Only a first load with nothing on screen reports the error.
        if (!loaded.current) {
          setError(errorMessage(err, "Impossible de charger les devoirs."))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey, liveHomework])

  return {
    assignments,
    setAssignments,
    loading,
    error,
    setError,
    setLoading,
    setReloadKey,
  }
}

export function useToggleDone(
  setAssignments: (updater: (prev: Assignment[]) => Assignment[]) => void
) {
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [toggleError, setToggleError] = useState<string | null>(null)
  const inFlight = useRef(new Set<string>())

  const setDone = useCallback(
    (key: string, done: boolean) => {
      setAssignments((prev) =>
        prev.map((item) => (item.key === key ? { ...item, done } : item))
      )
    },
    [setAssignments]
  )

  const toggle = useCallback(
    async (assignment: Assignment) => {
      if (inFlight.current.has(assignment.key)) return
      const next = !assignment.done

      inFlight.current.add(assignment.key)
      setPending(new Set(inFlight.current))
      setToggleError(null)
      setDone(assignment.key, next)
      triggerHapticLight()

      try {
        if (next) await ld.homework.markAsDone([assignment.id])
        else await ld.homework.markAsUndone([assignment.id])
        // The ledger learns the new state first: quests must know whether
        // Scolup is the one completing this homework (see mergeLedger).
        await syncHomework([{ ...assignment, done: next }], true)
        if (next) {
          // The id makes each homework count once, however often it is ticked.
          const id = String(assignment.id)
          const dueDay = toDayKey(assignment.due)
          const today = toDayKey(new Date())
          void track("homework-done", id)
          if (dueDay >= today) {
            // On time = ticked by the end of the due day.
            void track("homework-ontime", id, {
              subject: subjectId(assignment.subjectCode, assignment.subject),
              due: dueDay,
            })
          } else {
            void track("homework-late", id)
          }
          if (dueDay > today) {
            void track("homework-early", id)
            if (assignment.isTest) void track("test-prepared", id)
          }
        }
      } catch (err) {
        setDone(assignment.key, !next)
        setToggleError(
          errorMessage(err, "Impossible de mettre à jour ce devoir.")
        )
      } finally {
        inFlight.current.delete(assignment.key)
        setPending(new Set(inFlight.current))
      }
    },
    [setDone]
  )

  return { toggle, pending, toggleError, setToggleError }
}
