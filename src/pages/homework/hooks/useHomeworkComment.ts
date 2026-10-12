"use client"

import { useCallback, useRef, useState } from "react"
import { ld } from "@/services/linkdirecte"
import { errorMessage } from "@/services/errors"
import { accountDisplayName } from "@/services/profile"
import { appendComment } from "../helpers"
import type { Assignment } from "../helpers"

export interface CommentComposer {
  draft: string
  setDraft: (draft: string) => void
  pending: boolean
  error: string | null
  clearError: () => void
  send: (assignment: Assignment) => Promise<void>
}

export function useHomeworkComment(
  setAssignments: (updater: (prev: Assignment[]) => Assignment[]) => void
): CommentComposer {
  const [draft, setDraftState] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  // ponytail: clears the previous error on the next keystroke; a per-field
  // error map would only pay off with several inputs in this form.
  const setDraft = useCallback((draft: string) => {
    setDraftState(draft)
    setError(null)
  }, [])

  const send = useCallback(
    async (assignment: Assignment) => {
      const message = draft.trim()
      if (!message || inFlight.current) return

      inFlight.current = true
      setPending(true)
      setError(null)
      try {
        const { id } = await ld.homework.sendHomeworkComment(
          assignment.id,
          message
        )
        setAssignments((prev) =>
          appendComment(prev, assignment.key, {
            id,
            author: accountDisplayName(),
            message,
            date: new Date(),
          })
        )
        setDraftState("")
      } catch (err) {
        setError(errorMessage(err, "Impossible d'envoyer le commentaire."))
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [draft, setAssignments]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { draft, setDraft, pending, error, clearError, send }
}
