import { useOnboardingCompleted } from "./onboardingStatus"

export function useOnboardingStatus() {
  const completed = useOnboardingCompleted()

  return {
    hasCompletedOnboarding: completed === true,
    isLoading: completed === null,
  }
}
