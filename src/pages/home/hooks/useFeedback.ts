import { useCallback, useState } from "react"
export function useFeedback() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ask = useCallback(() => {
    setError(null)
    setOpen(true)
  }, [])

  const submit = useCallback(async () => {
    const text = message.trim()
    if (!text || pending) return
    setPending(true)
    setError(null)
    try {
      // Anonymous by design: nothing but the message leaves the device, which
      // is what the privacy page promises.
      const res = await fetch("https://feedback.api.scolup.com", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      })
      if (!res.ok) throw new Error(`http_${res.status}`)
      setMessage("")
      setOpen(false)
    } catch {
      setError("Envoi impossible, réessaie.")
    } finally {
      setPending(false)
    }
  }, [message, pending])

  const setOpenGuarded = useCallback(
    (next: boolean) => {
      if (pending) return
      setOpen(next)
    },
    [pending]
  )

  return {
    open,
    message,
    pending,
    error,
    setMessage,
    setOpen: setOpenGuarded,
    ask,
    submit,
  }
}
