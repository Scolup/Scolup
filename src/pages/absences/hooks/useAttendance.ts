import { useEffect, useMemo, useRef, useState } from "react"
import { ld } from "@/services/lowdirecte"
import { errorMessage } from "@/services/errors"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import {
  attendanceStats,
  isEmptyAttendance,
  isNoAttendanceData,
  parseAttendance,
  type AttendanceEvent,
  type AttendancePayload,
  type MiscEvent,
} from "../helpers"

export interface AttendanceModel {
  events: AttendanceEvent[]
  sanctions: MiscEvent[]
  dispenses: MiscEvent[]
  isEmpty: boolean
  stats: ReturnType<typeof attendanceStats>
  loading: boolean
  error: string | null
  retry: () => void
}

const EMPTY: AttendancePayload = { events: [], sanctions: [], dispenses: [] }

export function useAttendance(): AttendanceModel {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const liveAttendance = useLiveRefresh("attendance")
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Only the first load shows a skeleton; a live refresh swaps the
      // payload in place.
      setLoading(!loaded.current)
      try {
        if (!(await ld.auth.loadSession())) {
          throw new Error("Aucune session active. Reconnecte-toi.")
        }
        const result = (await ld.attendance.getAttendance()) as {
          absencesRetards?: unknown
          sanctionsEncouragements?: unknown
          dispenses?: unknown
        }
        if (cancelled) return
        loaded.current = true
        setData(parseAttendance(result))
        setError(null)
      } catch (err) {
        if (cancelled) return
        if (isNoAttendanceData(err)) {
          loaded.current = true
          setData(EMPTY)
          setError(null)
        } else if (!loaded.current) {
          setError(errorMessage(err, "Impossible de charger les absences."))
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey, liveAttendance])

  const stats = useMemo(() => attendanceStats(data), [data])

  return {
    ...data,
    isEmpty: isEmptyAttendance(data),
    stats,
    loading,
    error,
    retry: () => {
      setError(null)
      setReloadKey((key) => key + 1)
    },
  }
}
