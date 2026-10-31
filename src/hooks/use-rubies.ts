import { useEffect, useState } from "react"
import {
  getPendingRubies,
  getRubies,
  loadRubies,
  subscribeRubies,
} from "@/services/rubies"

export function useRubies() {
  const [rubies, setRubiesState] = useState(() => getRubies())

  useEffect(() => {
    void loadRubies().then(() => setRubiesState(getRubies()))
    return subscribeRubies(() => setRubiesState(getRubies()))
  }, [])

  return rubies
}

// Rewards the student has earned but not claimed yet.
export function usePendingRubies() {
  const [pending, setPendingState] = useState(() => getPendingRubies())

  useEffect(() => {
    void loadRubies().then(() => setPendingState(getPendingRubies()))
    return subscribeRubies(() => setPendingState(getPendingRubies()))
  }, [])

  return pending
}
