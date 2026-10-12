"use client"

import { useEffect, useState } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { SPRING_POP } from "@/hooks/use-micro-interactions"

// Façon Papillon `CircularProgress` : l'anneau se remplit puis un check
// poppe au centre à 100 %. La micro-célébration sans confettis.
export function ProgressRing({
  value = 1,
  size = 36,
  label = "Terminé",
  className,
}: {
  value?: number
  size?: number
  label?: string
  className?: string
}) {
  const [fill, setFill] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFill(value))
    return () => cancelAnimationFrame(raf)
  }, [value])

  const done = fill >= 1
  const radius = (size - 5) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <span
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className={cn("relative inline-flex shrink-0", className)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, fill))}
          className="stroke-done transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      {done && (
        <m.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_POP}
          className="absolute inset-0 flex items-center justify-center text-done"
        >
          <HugeiconsIcon
            icon={Tick02Icon}
            strokeWidth={3}
            style={{ width: size * 0.45, height: size * 0.45 }}
            aria-hidden="true"
          />
        </m.span>
      )}
    </span>
  )
}
