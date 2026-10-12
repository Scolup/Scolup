"use client"

import { AnimatePresence, m } from "motion/react"
import { cn } from "@/lib/utils"
import { EASE_OUT } from "@/hooks/use-micro-interactions"

// Façon Papillon `AnimatedNumber` : la chaîne est découpée par caractère et
// seuls les caractères qui changent animent (les autres gardent leur clé).
// Quand la moyenne passe de 14,25 à 14,75, seul le milieu roule.
export function AnimatedNumber({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      {value.split("").map((char, index) => (
        <span key={index} className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={char}
              initial={{ y: "65%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-65%", opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="inline-block"
            >
              {char === " " ? " " : char}
            </m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}
