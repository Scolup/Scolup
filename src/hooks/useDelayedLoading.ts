import { useEffect, useState } from "react"

// Shows `true` only if `loading` stays true longer than `delayMs`. Fast loads
// (< 150 ms) never flash a skeleton; slow loads show one without an
// artificial minimum duration.
export function useDelayedLoading(loading: boolean, delayMs = 150): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [loading, delayMs])

  return visible
}
