import { cn } from "@/lib/utils"

export function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span
        className={cn(
          "h-1.5 rounded-full transition-all",
          step === 1 ? "w-6 bg-primary" : "w-3 bg-primary/30"
        )}
      />
      <span
        className={cn(
          "h-1.5 rounded-full transition-all",
          step === 2 ? "w-6 bg-primary" : "w-3 bg-primary/30"
        )}
      />
    </div>
  )
}
