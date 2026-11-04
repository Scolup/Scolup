import { useEffect, useRef } from "react"

// Tous les onglets partagent un seul conteneur qui défile : on retient sa
// position pour chaque route, on la rétablit au retour, et on repart du haut
// à la première visite.
export function useScrollMemory(pathname: string) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const positions = useRef(new Map<string, number>())
  const previousPath = useRef(pathname)

  useEffect(() => {
    const element = scrollRef.current
    const from = previousPath.current
    previousPath.current = pathname
    if (!element || from === pathname) return
    positions.current.set(from, element.scrollTop)
    element.scrollTop = positions.current.get(pathname) ?? 0
  }, [pathname])

  return scrollRef
}
