import { useEffect, useState } from "react"
import { ld } from "@/services/lowdirecte"
import type { Resource } from "lowdirecte"

/**
 * Counts Lowdirecte cache writes for `resource`.
 *
 * Lowdirecte already refetches every resource on a timer, so a mounted screen
 * only has to learn that a poll landed. It fires on a changed payload only,
 * never on an identical one, so an idle app costs no re-renders.
 */
export function useLiveRefresh(resource: Resource | undefined): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!resource) return undefined
    const stop = ld.cache.watch(resource, () =>
      setVersion((value) => value + 1)
    )
    return () => {
      stop()
    }
  }, [resource])
  return version
}
