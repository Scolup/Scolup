import { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router"
import { getSetting, setSetting } from "@/services/storage"

const ONBOARDING_STEPS = ["theme", "login", "welcome"] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

const SETUP_STEP_COUNT = ONBOARDING_STEPS.length - 1

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
    if (currentStepIndex > 0) goToStep(ONBOARDING_STEPS[currentStepIndex - 1])
  }, [currentStepIndex, goToStep])

  const isSetupStep =
    currentStepIndex >= 0 && currentStepIndex < SETUP_STEP_COUNT
  const progress = isSetupStep ? currentStepIndex : 0
  const isFirstStep = currentStepIndex === 0

  return {
    currentSegment,
    currentStepIndex,
    needsRedirect,
    isRestored,
    nextStep,
    previousStep,
    isSetupStep,
    progress,
    setupStepCount: SETUP_STEP_COUNT,
    isFirstStep,
  }
}
