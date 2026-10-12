import { cn } from "@/lib/utils"
import type { Competency } from "../helpers"

export function CompetencyDots({
  items,
  colors,
}: {
  items: Competency[]
  colors: string[]
}) {
  if (items.length === 0) return null
  return (
    <span
      className="flex items-center gap-1"
      aria-label={`${items.length} compétence${items.length > 1 ? "s" : ""} évaluée${items.length > 1 ? "s" : ""}`}
    >
      {items.map((item) => (
        <span
          key={item.key}
          aria-hidden="true"
          style={
            item.level !== null
              ? { backgroundColor: colors[item.level - 1] }
              : undefined
          }
          className={cn(
            "size-3 shrink-0 rounded-full",
            item.level === null && "bg-muted-foreground/40"
          )}
        />
      ))}
    </span>
  )
}
