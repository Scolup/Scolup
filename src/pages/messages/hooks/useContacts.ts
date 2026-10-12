import { useCallback, useEffect, useState } from "react"
import { ld } from "@/services/lowdirecte"
import { errorMessage } from "@/services/errors"
import { mergeContacts, type Contact } from "../helpers"

const FALLBACK = "Impossible de charger les destinataires."

function contactsOf(payload: unknown): unknown[] {
  return (payload as { contacts?: unknown[] })?.contacts ?? []
}

export function useContacts(enabled: boolean) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        // ponytail: ED rejette parfois un des deux types (souvent "A")
        // pour une classe donnée. Un succès partiel débloque l'envoi :
        // on ne signale l'erreur que si les deux échouent.
        const settled = await Promise.allSettled([
          ld.messages.getContacts({ type: "P" }),
          ld.messages.getContacts({ type: "A" }),
        ])
        if (cancelled) return
        const raw = [
          ...contactsOf(
            settled[0].status === "fulfilled" ? settled[0].value : undefined
          ),
          ...contactsOf(
            settled[1].status === "fulfilled" ? settled[1].value : undefined
          ),
        ]
        const failures = settled.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        )
        if (raw.length === 0 && failures.length > 0) {
          throw failures[0].reason
        }
        setContacts(mergeContacts(raw))
      } catch (err) {
        if (cancelled) return
        setError(errorMessage(err, FALLBACK))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, reloadKey])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  return { contacts, loading, error, retry }
}
