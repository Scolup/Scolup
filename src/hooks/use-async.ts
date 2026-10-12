import { useEffect, useState } from "react"

export interface AsyncResult<T> {
  data: T | undefined
  error: unknown
  loading: boolean
}

export function useAsync<T>(
  task: () => Promise<T>,
  deps: readonly unknown[]
): AsyncResult<T> {
  const [result, setResult] = useState<AsyncResult<T>>({
    data: undefined,
    error: null,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    // A refetch keeps the value already on screen: `loading` describes the
    // first load only, so a background refresh never blanks the UI.
    setResult((prev) =>
      prev.data === undefined
        ? { data: undefined, error: null, loading: true }
        : { ...prev, error: null }
    )
    task().then(
      (data) => {
        if (!cancelled) setResult({ data, error: null, loading: false })
      },
      (error) => {
        if (cancelled) return
        // A failed refresh leaves the previous data in place: it is seconds
        // old, and the offline banner already says the app is not live. Only a
        // first load with nothing to show reports the error.
        setResult((prev) =>
          prev.data === undefined
            ? { data: undefined, error, loading: false }
            : { ...prev, loading: false }
        )
      }
    )
    return () => {
      cancelled = true
    }
  }, deps)

  return result
}
