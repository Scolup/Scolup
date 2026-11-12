import { useMemo } from "react"
import type { ElementType } from "react"
import { sanitizeHtml } from "@/lib/html"

// Seul endroit de l'app qui injecte du HTML venu de l'ENT dans la page : il
// passe toujours par sanitizeHtml (liste blanche), et seulement quand le texte
// change.
export function RichHtml({
  html,
  as: Tag = "div",
  className,
}: {
  html: string
  as?: ElementType
  className?: string
}) {
  const clean = useMemo(() => sanitizeHtml(html), [html])
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />
  )
}
