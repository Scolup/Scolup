import { useEffect, useEffectEvent, useState } from "react"

// Raccourci clavier « h » : masque ou affiche la barre d'onglets.
// Ignoré quand on tape dans un champ ou avec une touche de modification.
export function useTabBarShortcut() {
  const [hidden, setHidden] = useState(false)

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "h" || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }
    const target = event.target as HTMLElement | null
    const typing =
      target &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
        target.isContentEditable)
    if (typing) return
    setHidden((current) => !current)
  })

  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return hidden
}
