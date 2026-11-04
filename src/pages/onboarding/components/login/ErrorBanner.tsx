import { m, AnimatePresence } from "motion/react"
import { FieldError } from "@/components/ui/field"

export interface ErrorBannerProps {
  error: string | null
  errorKey: number
  errorShake: boolean
}

export function ErrorBanner({ error, errorKey, errorShake }: ErrorBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <m.div
          key={errorKey}
          initial={{ opacity: 0, y: -8 }}
          animate={{
            opacity: 1,
            y: 0,
            x: errorShake ? [0, -6, 6, -4, 4, 0] : 0,
          }}
          transition={{
            duration: errorShake ? 0.4 : 0.2,
            ease: "easeOut",
          }}
        >
          <FieldError>{error}</FieldError>
        </m.div>
      )}
    </AnimatePresence>
  )
}
