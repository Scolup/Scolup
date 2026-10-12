"use client"

import type { ReactNode } from "react"
import { m, type HTMLMotionProps } from "motion/react"

export function FadeIn({
  children,
  ...rest
}: { children: ReactNode } & HTMLMotionProps<"div">) {
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.15, 1] }}
      {...rest}
    >
      {children}
    </m.div>
  )
}
