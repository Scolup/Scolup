import { useOnboardingCompleted } from "@/services/onboarding"

export function useOnboardingStatus() {
  const completed = useOnboardingCompleted()

  return {
    hasCompletedOnboarding: completed === true,
    isLoading: completed === null,
  }
}
