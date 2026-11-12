import { m } from "motion/react"
import { Button } from "@/components/ui/button"
import { fadeUp, staggerContainer } from "@/lib/motion"

export function ComposeSuccess({ onClose }: { onClose: () => void }) {
  return (
    <m.div
      variants={staggerContainer(0.09, 0.05)}
      initial="hidden"
      animate="visible"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center"
    >
      <m.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 19 }}
        className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          aria-hidden="true"
        >
          <m.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
      </m.span>
      <m.p
        variants={fadeUp(10, 0.35)}
        className="text-lg font-semibold text-card-foreground"
      >
        Message envoyé
      </m.p>
      <m.p
        variants={fadeUp(10, 0.35)}
        className="max-w-xs text-sm text-muted-foreground"
      >
        Ton message est parti. Tu le retrouveras dans tes envoyés après
        synchronisation.
      </m.p>
      <m.div variants={fadeUp(10, 0.35)}>
        <Button onClick={onClose} className="mt-2 min-h-11 px-6" size="lg">
          Fermer
        </Button>
      </m.div>
    </m.div>
  )
}
