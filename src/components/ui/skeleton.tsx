import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:animate-[shimmer_1.8s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/10 after:to-transparent motion-reduce:after:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
