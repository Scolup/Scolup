import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { LoginChallenge } from "lowdirecte"
import { ld } from "@/services/lowdirecte"
import { errorMessage } from "@/services/errors"
type LoginPhase = "credentials" | "2fa"

export interface LoginModel {
  phase: LoginPhase
  challenge: LoginChallenge | null
  selectedChoice: number | null
  submitting: boolean
  error: string | null
  errorKey: number
  errorShake: boolean
  showPassword: boolean
  ready: boolean
  togglePassword: () => void
  submit: (event: FormEvent) => void
  answer: (index: number) => void
  backToCredentials: () => void
}

export function useLogin(onNext?: () => void): LoginModel {
  const [phase, setPhase] = useState<LoginPhase>("credentials")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [errorShake, setErrorShake] = useState(false)
  const [ready, setReady] = useState(false)
  const [errorKey, setErrorKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ld.auth
      .loadSession()
      .then((restored) => {
        if (cancelled || !restored) return
        void ld.auth.refreshToken().catch(() => {})
        onNext?.()
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [onNext])

  const fail = useCallback((message: string) => {
    setError(message)
    setErrorKey((key) => key + 1)
    setErrorShake(true)
    setTimeout(() => setErrorShake(false), 500)
  }, [])

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      setError(null)

      const data = new FormData(event.currentTarget as HTMLFormElement)
      const identifier = (data.get("identifier") as string)?.trim()
      const password = data.get("password") as string
      if (!identifier || !password) {
        setError("Renseigne ton identifiant et ton mot de passe.")
        return
      }

      setSubmitting(true)
      ld.auth
        .login(identifier, password, { rememberMe: true })
        .then((result) => {
          if (result.type === "success") onNext?.()
          else {
            setChallenge(result)
            setPhase("2fa")
          }
        })
        .catch((err) => fail(errorMessage(err, "Connexion échouée.")))
        .finally(() => setSubmitting(false))
    },
    [fail, onNext]
  )

  const answer = useCallback(
    (index: number) => {
      if (!challenge) return
      setSelectedChoice(index)
      setSubmitting(true)
      setError(null)
      challenge
        .answer(index)
        .then(() => onNext?.())
        .catch((err) => {
          setError(errorMessage(err, "Réponse incorrecte."))
          setSelectedChoice(null)
        })
        .finally(() => setSubmitting(false))
    },
    [challenge, onNext]
  )

  const backToCredentials = useCallback(() => {
    setPhase("credentials")
    setChallenge(null)
    setSelectedChoice(null)
    setError(null)
  }, [])

  return {
    phase,
    challenge,
    selectedChoice,
    submitting,
    error,
    errorKey,
    errorShake,
    showPassword,
    ready,
    togglePassword: () => setShowPassword((shown) => !shown),
    submit,
    answer,
    backToCredentials,
  }
}
