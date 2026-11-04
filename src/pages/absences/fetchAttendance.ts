import { ld } from "@/services/litedirecte"
import { isNoAttendanceData, parseAttendance } from "./mappers"
import type { AttendancePayload } from "./types"

export const EMPTY_ATTENDANCE: AttendancePayload = {
  events: [],
  sanctions: [],
  dispenses: [],
}

export async function fetchAttendance(): Promise<AttendancePayload> {
  if (!(await ld.auth.loadSession())) {
    throw new Error("Aucune session active. Reconnecte-toi.")
  }
  try {
    const result = (await ld.attendance.getAttendance()) as {
      absencesRetards?: unknown
      sanctionsEncouragements?: unknown
      dispenses?: unknown
    }
    return parseAttendance(result)
  } catch (err) {
    // Un compte sans aucune absence reçoit une erreur d'EcoleDirecte : ce n'est
    // pas un vrai échec, on affiche simplement une liste vide.
    if (isNoAttendanceData(err)) return EMPTY_ATTENDANCE
    throw err
  }
}
