import { useEffect, useRef, useState } from "react"
import { pageTransitionVariants, type Direction } from "../page-transitions"

export function useStepDirection(currentStepIndex: number) {
  const previousIndex = useRef(currentStepIndex)
  const [direction, setDirection] = useState<Direction>(1)

  useEffect(() => {
    if (currentStepIndex === previousIndex.current) return
    setDirection(currentStepIndex > previousIndex.current ? 1 : -1)
    previousIndex.current = currentStepIndex
  }, [currentStepIndex])

  return { direction, variants: pageTransitionVariants }
}

export function useOnboardingPrefetch() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("../components/LoginForm")
      void import("../components/Welcome")
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [])
}
