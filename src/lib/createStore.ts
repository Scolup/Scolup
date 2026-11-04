import { useSyncExternalStore } from "react"

// Une petite valeur partagée entre plusieurs composants, avec abonnement.
// `onSubscribe` est appelé à chaque abonnement : pratique pour charger la
// valeur enregistrée au moment où un composant en a besoin.
export function createStore<T>(initial: T, onSubscribe?: () => void) {
  let value = initial
  const listeners = new Set<() => void>()

  function get() {
    return value
  }

  function set(next: T) {
    value = next
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    onSubscribe?.()
    return () => {
      listeners.delete(listener)
    }
  }

  // Hook React : se met à jour quand la valeur change.
  function use() {
    return useSyncExternalStore(subscribe, get, get)
  }

  return { get, set, use }
}
