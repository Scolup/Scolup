import { useMemo, useState } from "react"
import { errorMessage } from "@/services/errors"
import { useAsync } from "@/hooks/useAsync"
import { useLiveRefresh } from "@/hooks/useLiveRefresh"
import { EMPTY_ATTENDANCE, fetchAttendance } from "../fetchAttendance"
import { isEmptyAttendance } from "../mappers"
import { attendanceStats } from "../stats"
import type { AttendanceEvent, MiscEvent } from "../types"

interface AttendanceModel {
  events: AttendanceEvent[]
  sanctions: MiscEvent[]
  dispenses: MiscEvent[]
  isEmpty: boolean
  stats: ReturnType<typeof attendanceStats>
  loading: boolean
  error: string | null
  retry: () => void
}

export function useAttendance(): AttendanceModel {
  const [reloadKey, setReloadKey] = useState(0)
  const liveAttendance = useLiveRefresh("attendance")
  const { data, error, loading } = useAsync(fetchAttendance, [
    reloadKey,
    liveAttendance,
  ])

  const attendance = data ?? EMPTY_ATTENDANCE
  const stats = useMemo(() => attendanceStats(attendance), [attendance])

  return {
    ...attendance,
    isEmpty: isEmptyAttendance(attendance),
    stats,
    loading,
    error: error
      ? errorMessage(error, "Impossible de charger les absences.")
      : null,
    retry: () => setReloadKey((key) => key + 1),
  }
}
