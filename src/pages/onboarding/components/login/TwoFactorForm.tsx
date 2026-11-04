import { m } from "motion/react"
import type { LoginChallenge } from "litedirecte"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { fadeUp } from "@/lib/motion"
import { type ErrorBannerProps, ErrorBanner } from "./ErrorBanner"

interface TwoFactorFormProps extends ErrorBannerProps {
  challenge: LoginChallenge
  selectedChoice: number | null
  submitting: boolean
  onAnswer: (index: number) => void
  onBack: () => void
}

export function TwoFactorForm({
  challenge,
  selectedChoice,
  submitting,
  onAnswer,
  onBack,
  ...error
}: TwoFactorFormProps) {
  const sortedChoices = [...challenge.choices].sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  )

  return (
    <m.div key="2fa" variants={fadeUp()} className="flex flex-col gap-3">
      <p className="text-center text-sm font-medium">{challenge.question}</p>

      <div className="flex flex-col gap-2">
        {sortedChoices.map((choice) => {
          const index = challenge.choices.indexOf(choice)
          return (
            <m.div
              key={choice}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant={selectedChoice === index ? "default" : "outline"}
                disabled={submitting}
                onClick={() => onAnswer(index)}
                className={cn(
                  "w-full justify-start text-left text-sm",
                  selectedChoice === index && "pointer-events-none"
                )}
              >
                {choice}
              </Button>
            </m.div>
          )
        })}
      </div>

      <ErrorBanner {...error} />

      <m.button
        type="button"
        className="mt-2 cursor-pointer text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary-text"
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={onBack}
      >
        Retour aux identifiants
      </m.button>
    </m.div>
  )
}
