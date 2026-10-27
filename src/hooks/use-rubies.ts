import { useEffect, useState } from "react"
import { getRubies, loadRubies, subscribeRubies } from "@/services/rubies"

export function useRubies() {
  const [rubies, setRubiesState] = useState(() => getRubies())

  useEffect(() => {
    void loadRubies().then(() => setRubiesState(getRubies()))
    return subscribeRubies(() => setRubiesState(getRubies()))
  }, [])

  return rubies
}
