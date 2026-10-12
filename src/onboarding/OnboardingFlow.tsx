import { Navigate } from "react-router"
import { AnimatePresence, m } from "motion/react"
import { cn } from "@/lib/utils"
import { useOnboardingNavigation } from "@/hooks/use-onboarding-navigation"
import { OnboardingNavigationHeader } from "./components/NavigationHeader"
import { OnboardingProgressBar } from "./components/ProgressBar"
import { OnboardingStepRenderer } from "./components/StepRenderer"
import {
  useOnboardingPrefetch,
  useStepDirection,
} from "./hooks/useOnboardingFlow"

export function OnboardingFlow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    currentSegment,
    currentStepIndex,
    needsRedirect,
    isRestored,
    nextStep,
    previousStep,
    isSetupStep,
    progress,
    setupStepCount,
    isFirstStep,
  } = useOnboardingNavigation()

  const { direction, variants } = useStepDirection(currentStepIndex)
  useOnboardingPrefetch()

  if (needsRedirect && isRestored) {
    return <Navigate to="/onboarding/theme" replace />
  }

  if (needsRedirect) {
    return null
  }

  return (
    <div
      className={cn("mx-auto flex w-full max-w-sm flex-col p-6", className)}
      {...props}
    >
      {isSetupStep && !isFirstStep && (
        <OnboardingNavigationHeader onBack={previousStep} />
      )}

      <div className="relative flex min-h-0 flex-1 flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={currentSegment}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={direction}
            className="flex flex-col justify-center"
          >
            <OnboardingStepRenderer
              stepIndex={currentStepIndex}
              onNext={nextStep}
            />
          </m.div>
        </AnimatePresence>
      </div>

      {isSetupStep && (
        <OnboardingProgressBar progress={progress} total={setupStepCount} />
      )}
    </div>
  )
}
