import { useState } from "react"

const seen = new Set<string>()

// Vrai uniquement la première fois qu'un écran (ou une zone) s'affiche pendant
// la session. Les onglets sont démontés quand on les quitte : sans ça, chaque
// retour sur un onglet rejouerait toutes ses animations d'entrée, ce qui est
// lourd et fatigant. Les données déjà en cache s'affichent donc directement.
export function useFirstVisit(key: string): boolean {
  const [first] = useState(() => {
    const isFirst = !seen.has(key)
    seen.add(key)
    return isFirst
  })
  return first
}
