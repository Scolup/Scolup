import { createStore } from "@/lib/createStore"

export interface ApiErrorDetails {
  code: string
  description: string
}

// Première erreur inattendue gagnante : plusieurs widgets peuvent échouer en
// parallèle, un seul écran d'erreur doit s'afficher.
export const apiErrorStore = createStore<ApiErrorDetails | null>(null)

// Le code 526 du renouvellement de session est avalé par Litedirecte : on le
// garde ici pour ouvrir la feuille de reconnexion avec le bon message.
export const renewTokenExpiredStore = createStore(false)

export function reportApiError(details: ApiErrorDetails): void {
  if (apiErrorStore.get() === null) apiErrorStore.set(details)
}

export function clearApiError(): void {
  apiErrorStore.set(null)
}

export function markRenewTokenExpired(): void {
  renewTokenExpiredStore.set(true)
}

export function clearRenewTokenExpired(): void {
  renewTokenExpiredStore.set(false)
}
