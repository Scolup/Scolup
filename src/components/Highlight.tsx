import type { ReactNode } from "react"

export function highlight(text: string, query: string): ReactNode {
  const normalized = query.trim()
  if (!normalized) return text
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "ig"))
  return parts.map((part, index) =>
    part.toLowerCase() === normalized.toLowerCase() ? (
      <mark
        key={`${index}-${part}`}
        className="rounded-sm bg-primary/20 text-inherit"
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}
