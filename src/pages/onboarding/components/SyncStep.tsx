import { useEffect, useRef } from "react"
import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { fadeUp } from "@/lib/motion"

interface SyncStepProps extends React.ComponentProps<"div"> {
  onNext?: () => void
}

export function SyncStep({ className, onNext }: SyncStepProps) {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    onNext?.()
  }, [onNext])

  return (
    <m.div
      className={cn("flex flex-col items-center gap-5 text-center", className)}
      variants={fadeUp()}
      initial="hidden"
      animate="visible"
    >
      <Spinner className="size-8" />
      <h1 className="text-xl font-bold">Récupération de tes réglages…</h1>
    </m.div>
  )
}
