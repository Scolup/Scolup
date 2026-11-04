import { createStore } from "@/lib/createStore"

const store = createStore<number | null>(null)

export function setUnreadMessagesCount(next: number | null) {
  if (next === store.get()) return
  store.set(next)
}

// Initialise le compteur seulement s'il est encore inconnu.
export function seedUnreadMessagesCount(next: number) {
  if (store.get() !== null) return
  store.set(next)
}

export function useUnreadMessagesCount(): number | null {
  return store.use()
}
