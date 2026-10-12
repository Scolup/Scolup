import { useSyncExternalStore } from "react"

let count: number | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function setUnreadMessagesCount(next: number | null) {
  if (next === count) return
  count = next
  emit()
}

export function seedUnreadMessagesCount(next: number) {
  if (count !== null) return
  count = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return count
}

export function useUnreadMessagesCount(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
