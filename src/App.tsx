import { lazy, Suspense, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router"
import { useOnboardingStatus } from "@/hooks/use-onboarding-status"
import { revealRoute } from "@/services/splash"

const loaders = {
  onboarding: () => import("@/onboarding/OnboardingFlow"),
  shell: () => import("@/shell"),
  terms: () => import("@/pages/legal/Terms"),
  privacy: () => import("@/pages/legal/Privacy"),
  security: () => import("@/pages/legal/Security"),
  mentions: () => import("@/pages/legal/Mentions"),
}

const OnboardingFlow = lazy(() =>
  loaders.onboarding().then((m) => ({ default: m.OnboardingFlow }))
)
const MainFlow = lazy(() =>
  loaders.shell().then((m) => ({ default: m.MainFlow }))
)
const Terms = lazy(() => loaders.terms().then((m) => ({ default: m.Terms })))
const Privacy = lazy(() =>
  loaders.privacy().then((m) => ({ default: m.Privacy }))
)
const Security = lazy(() =>
  loaders.security().then((m) => ({ default: m.Security }))
)
const Mentions = lazy(() =>
  loaders.mentions().then((m) => ({ default: m.Mentions }))
)

// Unmounting is the "content arrived" signal: both places below stand in for a
// route that hasn't rendered yet, and the splash only makes sense while one of
// them is on screen. Nothing is painted on top of the splash: it already shows
// the Scolup loader, so the fallback stays invisible.
function Loading() {
  useEffect(() => {
    return () => revealRoute()
  }, [])

  return null
}

export default function App() {
  const { hasCompletedOnboarding, isLoading } = useOnboardingStatus()

  useEffect(() => {
    if (isLoading) {
      void loaders.onboarding()
      void loaders.shell()
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-center">
            <Loading />
          </div>
        }
      >
        <Routes>
          <Route
            path="/onboarding/*"
            element={
              hasCompletedOnboarding ? (
                <Navigate to="/" replace />
              ) : (
                <OnboardingFlow />
              )
            }
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/mentions" element={<Mentions />} />
          <Route
            path="/*"
            element={
              hasCompletedOnboarding ? (
                <MainFlow />
              ) : (
                <Navigate to="/onboarding/theme" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </div>
  )
}
