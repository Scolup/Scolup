import { useCallback, useState } from "react"
import { triggerHapticMedium } from "@/services/haptics"

export type FeedbackType = "bug" | "idea" | "other"

export const FEEDBACK_TYPES: {
  value: FeedbackType
  label: string
  hint: string
}[] = [
  { value: "bug", label: "Bug", hint: "Quelque chose ne marche pas" },
  { value: "idea", label: "Idée", hint: "Une amélioration à proposer" },
  { value: "other", label: "Autre", hint: "Un avis, une question…" },
]

const TYPE_PREFIX: Record<FeedbackType, string> = {
  bug: "Bug",
  idea: "Idée",
  other: "Autre",
}

export function useFeedback() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>("bug")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const ask = useCallback(() => {
    setError(null)
    setSent(false)
    setOpen(true)
  }, [])

  const setOpenGuarded = useCallback(
    (next: boolean) => {
      if (pending) return
      setOpen(next)
    },
    [pending]
  )

  const submit = useCallback(async () => {
    const text = message.trim()
    if (!text || pending) return
    setPending(true)
    setError(null)
    try {
      // Anonymous by design: nothing but the message leaves the device, which
      // is what the privacy page promises. The type, app version and user agent
      // are prefixed so the plain text endpoint stays unchanged, and they help
      // reproduce bugs without identifying the user.
      const body = [
        `${TYPE_PREFIX[type]} — ${text}`,
        "",
        `version ${__APP_VERSION__}`,
        navigator.userAgent,
      ].join("\n")
      const res = await fetch("https://feedback.api.scolup.com", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body,
      })
      if (!res.ok) throw new Error(`http_${res.status}`)
      setMessage("")
      setSent(true)
      triggerHapticMedium()
    } catch {
      setError("Envoi impossible, réessaie.")
    } finally {
      setPending(false)
    }
  }, [message, pending, type])

  return {
    open,
    type,
    message,
    pending,
    error,
    sent,
    setType,
    setMessage,
    setOpen: setOpenGuarded,
    ask,
    submit,
  }
}
