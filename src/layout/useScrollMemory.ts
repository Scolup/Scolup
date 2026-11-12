import { useEffect, useLayoutEffect, useRef } from "react"

// Tous les onglets partagent un seul conteneur qui défile : on retient sa
// position pour chaque route, on la rétablit au retour, et on repart du haut
// à la première visite.
// La position est mémorisée au fil du défilement (et non relue au changement
// de route, quand le navigateur a déjà pu la ramener à la hauteur du nouveau
// contenu), et rétablie avant l'affichage : plus de saut visible.
export function useScrollMemory(pathname: string) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const positions = useRef(new Map<string, number>())
  const currentPath = useRef(pathname)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const onScroll = () => {
      positions.current.set(currentPath.current, element.scrollTop)
    }
    element.addEventListener("scroll", onScroll, { passive: true })
    return () => element.removeEventListener("scroll", onScroll)
  }, [])

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element || currentPath.current === pathname) return
    currentPath.current = pathname
    element.scrollTop = positions.current.get(pathname) ?? 0
  }, [pathname])

  return scrollRef
}
