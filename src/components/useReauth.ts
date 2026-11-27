import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import type { LoginChallenge } from "litedirecte"
import { ld } from "@/services/litedirecte"
import { errorMessage } from "@/services/errors"
import {
  clearRenewTokenExpired,
  renewTokenExpiredStore,
} from "@/services/apiErrorStore"
import { resetOnboarding } from "@/features/onboarding/onboardingStatus"

type ReauthPhase = "credentials" | "2fa"

export interface ReauthModel {
  /** True while Litedirecte reports that the session needs a fresh login. */
  required: boolean
  /** The renew-token call answered 526 instead of a usable token. */
  renewExpired: boolean
  phase: ReauthPhase
  challenge: LoginChallenge | null
  identifier: string
  selectedChoice: number | null
  submitting: boolean
  error: string | null
  showPassword: boolean
  togglePassword: () => void
  submit: (event: FormEvent<HTMLFormElement>) => void
  answer: (index: number) => void
  backToCredentials: () => void
  logout: () => void
}

function isSyncAuthRequired(): boolean {
  try {
    return ld.sync.getState().state === "auth-required"
  } catch {
    return false
  }
}

/**
 * Drives the re-authentication sheet. Litedirecte flags an unrecoverable
 * session through `ld.sync` (`auth-required`); a 526 from the renew-token call
 * is tracked in `renewTokenExpiredStore`. A successful login clears both.
 */
export function useReauth(): ReauthModel {
  const [syncRequired, setSyncRequired] = useState(isSyncAuthRequired)
  const renewExpired = renewTokenExpiredStore.use()
  const required = syncRequired || renewExpired
  const [phase, setPhase] = useState<ReauthPhase>("credentials")
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const seenRequired = useRef(false)

  useEffect(() => {
    if (required) ld.stopPolling()
    else ld.resumePolling()
  }, [required])

  useEffect(() => {
    return ld.sync.onChange((state) => {
      setSyncRequired(state.state === "auth-required")
    })
  }, [])

  // A new expiry means a fresh form: drop any previous challenge or error.
  useEffect(() => {
    if (!required) {
      seenRequired.current = false
      return
    }
    if (seenRequired.current) return
    seenRequired.current = true
    setPhase("credentials")
    setChallenge(null)
    setSelectedChoice(null)
    setError(null)
    setSubmitting(false)
    setShowPassword(false)
  }, [required])

  const submit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const identifier = (data.get("identifier") as string)?.trim()
    const password = data.get("password") as string
    if (!identifier || !password) {
      setError("Renseigne ton identifiant et ton mot de passe.")
      return
    }

    setSubmitting(true)
    setError(null)
    ld.auth
      .login(identifier, password, { rememberMe: true })
      .then((result) => {
        if (result.type === "success") {
          clearRenewTokenExpired()
          setSyncRequired(false)
          return
        }
        setChallenge(result)
        setPhase("2fa")
      })
      .catch((err) => setError(errorMessage(err, "Connexion échouée.")))
      .finally(() => setSubmitting(false))
  }, [])

  const answer = useCallback(
    (index: number) => {
      if (!challenge) return
      setSelectedChoice(index)
      setSubmitting(true)
      setError(null)
      challenge
        .answer(index)
        .then(() => {
          clearRenewTokenExpired()
          setSyncRequired(false)
        })
        .catch((err) => {
          setError(errorMessage(err, "Réponse incorrecte."))
          setSelectedChoice(null)
        })
        .finally(() => setSubmitting(false))
    },
    [challenge]
  )

  const backToCredentials = useCallback(() => {
    setPhase("credentials")
    setChallenge(null)
    setSelectedChoice(null)
    setError(null)
  }, [])

  const logout = useCallback(() => {
    clearRenewTokenExpired()
    void ld.auth.logout().catch(() => {})
    void resetOnboarding().finally(() => {
      window.location.href = "/"
    })
  }, [])

  return {
    required,
    renewExpired,
    phase,
    challenge,
    identifier: ld.auth.getAccount()?.identifiant ?? "",
    selectedChoice,
    submitting,
    error,
    showPassword,
    togglePassword: () => setShowPassword((shown) => !shown),
    submit,
    answer,
    backToCredentials,
    logout,
  }
}
