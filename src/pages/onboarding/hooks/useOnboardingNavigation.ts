import { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router"
import { getSetting, setSetting } from "@/services/storage"
import { isPronote } from "@/services/litenote"

const ONBOARDING_STEPS = ["theme", "login", "welcome"] as const

type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
export type LoginService = "ecoledirecte" | "pronote"

const SETUP_STEP_COUNT = 3

export function useOnboardingNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isRestored, setIsRestored] = useState(false)

  const currentSegment =
    location.pathname.replace(/\/$/, "").split("/").pop() ?? ""
  const stepIndex = ONBOARDING_STEPS.indexOf(currentSegment as OnboardingStep)
  const needsRedirect =
    !currentSegment || currentSegment === "onboarding" || stepIndex === -1
  const currentStepIndex = needsRedirect ? -1 : stepIndex
  const service = new URLSearchParams(location.search).get("service")
  const loginService: LoginService | null =
    currentSegment === "login" &&
    (service === "ecoledirecte" || service === "pronote")
      ? service
      : null

  useEffect(() => {
    if (!needsRedirect) return

    let cancelled = false
    getSetting("onboardingStep")
      .then((saved) => {
        if (cancelled) return
        const validStep =
          typeof saved === "string" &&
          ONBOARDING_STEPS.includes(saved as OnboardingStep)
        if (validStep) navigate(`/onboarding/${saved}`, { replace: true })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsRestored(true)
      })
    return () => {
      cancelled = true
    }
  }, [needsRedirect, navigate])

  useEffect(() => {
    if (currentStepIndex >= 0) {
      setSetting("onboardingStep", ONBOARDING_STEPS[currentStepIndex])
    }
  }, [currentStepIndex])

  const goToStep = useCallback(
    (target: OnboardingStep) => {
      navigate(`/onboarding/${target}`)
    },
    [navigate]
  )

  const nextStep = useCallback(() => {
    const nextIdx = Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1)
    goToStep(ONBOARDING_STEPS[nextIdx])
  }, [currentStepIndex, goToStep])

  const previousStep = useCallback(() => {
    if (loginService) {
      navigate("/onboarding/login", { replace: true })
      return
    }
    if (currentStepIndex > 0) goToStep(ONBOARDING_STEPS[currentStepIndex - 1])
  }, [loginService, navigate, currentStepIndex, goToStep])

  const selectLoginService = (service: LoginService | null) => {
    navigate(
      service ? `/onboarding/login?service=${service}` : "/onboarding/login",
      {
        replace: true,
      }
    )
  }

  const isSetupStep = currentStepIndex >= 0 && currentSegment !== "welcome"
  const isConnecting =
    currentSegment === "login" && (loginService !== null || isPronote())
  const progress = isSetupStep ? currentStepIndex + Number(isConnecting) : 0
  const isFirstStep = currentStepIndex === 0

  return {
    currentSegment,
    currentStepIndex,
    needsRedirect,
    isRestored,
    nextStep,
    previousStep,
    loginService,
    selectLoginService,
    isSetupStep,
    progress,
    setupStepCount: SETUP_STEP_COUNT,
    isFirstStep,
  }
}
