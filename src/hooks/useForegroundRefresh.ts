import { useCallback, useEffect } from "react"
import { ld } from "@/services/litedirecte"
import { syncCloud } from "@/services/cloudSync"

// Seuil minimal entre deux rafraîchissements pour éviter les tempêtes.
const REFRESH_MIN_MS = 60_000

let lastAttempt = 0

function shouldRefresh(): boolean {
  const now = Date.now()
  if (now - lastAttempt < REFRESH_MIN_MS) return false
  try {
    const lastSync = ld.sync.getState().lastSync
    if (lastSync && now - lastSync < REFRESH_MIN_MS) return false
  } catch {
    // État de synchronisation illisible : on rafraîchit quand même.
  }
  lastAttempt = now
  return true
}

// Refetch doux des ressources visibles, sans recharger la page. Utilise le
// poll Litedirecte existant (`getAll`) : aucune nouvelle requête ajoutée,
// aucune logique de cache modifiée. Les écrans montés se mettent à jour via
// `useLiveRefresh`.
export function refreshVisibleResources(): void {
  if (!shouldRefresh()) return
  void ld.getAll().catch(() => {})
  void syncCloud().catch(() => {})
}

export function useForegroundRefresh(): () => void {
  const refresh = useCallback(() => {
    refreshVisibleResources()
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshVisibleResources()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  return refresh
}
