import { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router"
import { getSetting, setSetting } from "@/services/storage"

const ONBOARDING_STEPS = ["who", "login", "sync", "theme", "welcome"] as const

type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

// "sync" est un écran de transition : il ne compte pas dans la progression.
const SETUP_STEP_COUNT = 3

async function hasThemeSettings(): Promise<boolean> {
  // L'écran de transition laisse le temps à la synchronisation de rapatrier
  // les réglages du compte, y compris depuis un autre appareil.
  const { syncNow } = await import("@/services/cloudSync")
  await syncNow()
  const [accent, deco] = await Promise.all([
    getSetting("accent-color"),
    getSetting("deco-theme"),
  ])
  return (
    (typeof accent === "string" && accent.length > 0) ||
    (typeof deco === "string" && deco.length > 0)
  )
}

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

  const nextStep = useCallback(async () => {
    // Une couleur ou un thème déjà enregistré rend l'étape inutile.
    if (currentStepIndex === 2 && (await hasThemeSettings())) {
      goToStep("welcome")
      return
    }
    const nextIdx = Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1)
    goToStep(ONBOARDING_STEPS[nextIdx])
  }, [currentStepIndex, goToStep])

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) goToStep(ONBOARDING_STEPS[currentStepIndex - 1])
  }, [currentStepIndex, goToStep])

  const isSetupStep =
    currentSegment !== "sync" &&
    currentStepIndex >= 0 &&
    currentStepIndex < ONBOARDING_STEPS.length - 1
  const progress =
    currentStepIndex > 2 ? currentStepIndex - 1 : currentStepIndex
  // Le sync avance tout seul et la première étape n'a rien avant elle.
  const isFirstStep = currentStepIndex === 0 || currentStepIndex === 2

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
