import { m } from "motion/react"
import { Button } from "@/components/ui/button"
import { fadeUp } from "@/lib/motion"

export function OnboardingConfirmButton({
  label,
  confirmed,
  disabled,
  onClick,
}: {
  label: string
  confirmed: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <m.div
      variants={fadeUp()}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex flex-col gap-3"
    >
      <Button
        type="button"
        disabled={disabled || confirmed}
        onClick={onClick}
        className="relative overflow-hidden disabled:cursor-not-allowed"
      >
        {confirmed ? (
          <m.span
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            {label}
          </m.span>
        ) : (
          <span className="flex items-center gap-2">{label}</span>
        )}
      </Button>
    </m.div>
  )
}
