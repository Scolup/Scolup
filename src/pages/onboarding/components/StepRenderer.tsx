import { lazy, Suspense } from "react"
import { ThemeChoose } from "./ThemeChoose"
import { Spinner } from "@/components/ui/spinner"

const LoginForm = lazy(() =>
  import("./LoginForm").then((m) => ({
    default: m.LoginForm,
  }))
)
const Welcome = lazy(() =>
  import("./Welcome").then((m) => ({
    default: m.Welcome,
  }))
)

function StepFallback() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <Spinner />
    </div>
  )
}

interface StepRendererProps {
  stepIndex: number
  onNext: () => void
}

export function OnboardingStepRenderer({
  stepIndex,
  onNext,
}: StepRendererProps) {
  switch (stepIndex) {
    case 0:
      return <ThemeChoose onNext={onNext} />
    case 1:
      return (
        <Suspense fallback={<StepFallback />}>
          <LoginForm onNext={onNext} />
        </Suspense>
      )
    case 2:
      return (
        <Suspense fallback={<StepFallback />}>
          <Welcome onNext={onNext} />
        </Suspense>
      )
    default:
      return null
  }
}
