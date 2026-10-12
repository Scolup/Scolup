import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { staggerContainer, fadeUp } from "@/hooks/use-micro-interactions"

interface ProgressBarProps {
  progress: number
  total: number
}

export function OnboardingProgressBar({ progress, total }: ProgressBarProps) {
  return (
    <m.div
      className="mt-8 flex flex-col items-center gap-3"
      variants={staggerContainer(0.05, 0)}
      initial="hidden"
      animate="visible"
    >
      <div className="flex w-full gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <m.div
            key={i}
            variants={fadeUp(8)}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              i <= progress ? "bg-primary" : "bg-border"
            )}
            initial={false}
            animate={
              i === progress && progress > 0
                ? { scaleX: [1, 1.18, 1] }
                : { scaleX: 1 }
            }
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
              times: [0, 0.5, 1],
            }}
            style={{ originX: 0.5 }}
          />
        ))}
      </div>

      <m.p variants={fadeUp(8)} className="text-xs text-muted-foreground">
        Étape {progress + 1} sur {total}
      </m.p>
    </m.div>
  )
}
