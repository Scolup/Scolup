import * as React from "react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"output">) {
  return (
    <output
      data-slot="spinner"
      aria-label="Chargement"
      className={cn(
        "size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
