import { useSyncExternalStore } from "react"

// Lit la requête de façon synchrone dès le premier rendu (pas de passage par
// `false` puis correction) : une mise en page qui dépend de la largeur ne
// « saute » plus au chargement.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches
  )
}
