import { useMemo } from "react"
import type { ElementType, MouseEvent } from "react"
import { sanitizeHtml } from "@/lib/html"

const ZOOM_IMAGE = "button[data-zoom]"

// Les images du HTML de l'ENT ne sont pas interactives : on les enveloppe dans
// un vrai bouton pour que le clavier puisse aussi les agrandir.
function wrapImages(html: string): string {
  if (!html.includes("<img")) return html
  const doc = new DOMParser().parseFromString(html, "text/html")
  for (const image of Array.from(doc.body.querySelectorAll("img"))) {
    const button = doc.createElement("button")
    button.type = "button"
    button.dataset.zoom = ""
    button.setAttribute(
      "aria-label",
      image.getAttribute("alt") || "Agrandir l’image"
    )
    image.replaceWith(button)
    button.append(image)
  }
  return doc.body.innerHTML
}

// Seul endroit de l'app qui injecte du HTML venu de l'ENT dans la page : il
// passe toujours par sanitizeHtml (liste blanche), et seulement quand le texte
// change.
export function RichHtml({
  html,
  as: Tag = "div",
  className,
  onImageClick,
}: {
  html: string
  as?: ElementType
  className?: string
  onImageClick?: (src: string, alt: string) => void
}) {
  const clean = useMemo(() => {
    const sanitized = sanitizeHtml(html)
    return onImageClick ? wrapImages(sanitized) : sanitized
  }, [html, onImageClick])

  const handleClick = onImageClick
    ? (event: MouseEvent<HTMLElement>) => {
        const image = (event.target as HTMLElement)
          .closest(ZOOM_IMAGE)
          ?.querySelector("img")
        const src = image?.currentSrc || image?.getAttribute("src")
        if (image && src) onImageClick(src, image.getAttribute("alt") ?? "")
      }
    : undefined

  return (
    // Le conteneur ne fait que relayer les clics des boutons images qu'il
    // contient : ce sont eux qui portent le rôle et le clavier.
    // react-doctor-disable-next-line react-doctor/no-static-element-interactions
    <Tag
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
