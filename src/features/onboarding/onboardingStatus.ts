import { createStore } from "@/lib/createStore"
import { getSetting, getSettingSync, setSetting } from "@/services/storage"

// true : terminé, false : pas terminé, null : on ne sait pas encore.
function readCachedCompleted(): boolean | null {
  if (getSettingSync("onboardingCompleted") === true) return true
  if (getSettingSync("onboardingStep") === "welcome") return true
  return null
}

const store = createStore<boolean | null>(readCachedCompleted(), hydrate)
let hydrating = false

async function hydrate() {
  if (hydrating || store.get() !== null) return
  hydrating = true
  let completed = false
  try {
    const [flag, step] = await Promise.all([
      getSetting("onboardingCompleted"),
      getSetting("onboardingStep"),
    ])
    completed = flag === true || step === "welcome"
  } catch {
    // Lecture impossible : on considère l'onboarding comme non terminé.
  }
  hydrating = false
  store.set(completed)
}

export async function completeOnboarding(): Promise<void> {
  store.set(true)
  await Promise.all([
    setSetting("onboardingCompleted", true),
    setSetting("onboardingStep", "welcome"),
  ])
}

export async function resetOnboarding(): Promise<void> {
  store.set(false)
  await Promise.all([
    setSetting("onboardingCompleted", false),
    setSetting("onboardingStep", "theme"),
  ])
}

export function useOnboardingCompleted(): boolean | null {
  return store.use()
}
