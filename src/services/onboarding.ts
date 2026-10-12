import { useSyncExternalStore } from "react"
import { getSetting, getSettingSync, setSetting } from "@/services/storage"

function readCachedCompleted(): boolean | null {
  const flag = getSettingSync("onboardingCompleted")
  if (flag === true) return true
  if (getSettingSync("onboardingStep") === "welcome") return true
  return null
}

let completed: boolean | null = readCachedCompleted()
let hydrating = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function hydrate() {
  if (hydrating || completed !== null) return
  hydrating = true
  Promise.all([getSetting("onboardingCompleted"), getSetting("onboardingStep")])
    .then(([flag, step]) => {
      completed = flag === true || step === "welcome"
    })
    .catch(() => {
      completed = false
    })
    .finally(() => {
      hydrating = false
      emit()
    })
}

export async function completeOnboarding(): Promise<void> {
  completed = true
  emit()
  await Promise.all([
    setSetting("onboardingCompleted", true),
    setSetting("onboardingStep", "welcome"),
  ])
}

export async function resetOnboarding(): Promise<void> {
  completed = false
  emit()
  await Promise.all([
    setSetting("onboardingCompleted", false),
    setSetting("onboardingStep", "theme"),
  ])
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  hydrate()
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return completed
}

export function useOnboardingCompleted(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
