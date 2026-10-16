"use client"

import type { ReactNode } from "react"
import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FadeIn } from "@/ui/fade-in"
import type { Award02Icon } from "@hugeicons/core-free-icons"

export function EmptyState({
  icon,
  media,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof Award02Icon
  media?: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <FadeIn>
      <Empty className={className ?? "p-8"}>
        <EmptyHeader>
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <EmptyMedia variant="icon">
              {media ??
                (icon && <HugeiconsIcon icon={icon} aria-hidden="true" />)}
            </EmptyMedia>
          </m.div>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {action}
      </Empty>
    </FadeIn>
  )
}
