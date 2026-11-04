import { Suspense, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router"
import { useOnboardingStatus } from "./features/onboarding/useOnboardingStatus"
import { lazyPage } from "./lib/lazyPage"
import { revealRoute } from "./services/splash"

import { DecoParticles } from "@/components/DecoOrnament"

const loaders = {
  onboarding: () => import("./pages/onboarding/OnboardingFlow"),
  mainLayout: () => import("./layout/MainLayout"),
  terms: () => import("./pages/legal/Terms"),
  privacy: () => import("./pages/legal/Privacy"),
  security: () => import("./pages/legal/Security"),
  mentions: () => import("./pages/legal/Mentions"),
}

const OnboardingFlow = lazyPage(loaders.onboarding, "OnboardingFlow")
const MainLayout = lazyPage(loaders.mainLayout, "MainLayout")
const Terms = lazyPage(loaders.terms, "Terms")
const Privacy = lazyPage(loaders.privacy, "Privacy")
const Security = lazyPage(loaders.security, "Security")
const Mentions = lazyPage(loaders.mentions, "Mentions")

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
      void loaders.mainLayout()
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loading />
      </div>
    )
  }

  // The root must stay transparent: body already paints --background, and an
  // opaque background on an in-flow root would paint OVER the negative-z
  // particle weather layer (paint order puts in-flow backgrounds above
  // negative-z descendants while translucent/backdrop-blurred surfaces let
  // it show).
  return (
    <div className="flex min-h-dvh">
      <DecoParticles />
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
                <MainLayout />
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
