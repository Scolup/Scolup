import { resetOnboarding } from "@/features/onboarding/onboardingStatus"
import { triggerHapticMedium } from "./haptics"
import { resetLitedirecteData } from "./litedirecte"

const REQUIRED_TAPS = 5
const WINDOW_MS = 2000

// Dépannage discret : 5 taps rapides sur le logo du splash effacent la session
// Litedirecte et renvoient vers la connexion. Le compteur repart si l'utilisateur
// s'arrête, pour éviter un déclenchement accidentel à distance.
export function armSplashReset(): void {
  const logo = document.querySelector<HTMLImageElement>("#splash img")
  if (!logo) return

  let taps = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let resetting = false

  logo.addEventListener("click", () => {
    if (resetting) return
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      taps = 0
      timer = undefined
    }, WINDOW_MS)
    taps++
    if (taps < REQUIRED_TAPS) return

    resetting = true
    clearTimeout(timer)
    triggerHapticMedium()
    void (async () => {
      try {
        await resetLitedirecteData()
        await resetOnboarding()
      } finally {
        window.location.reload()
      }
    })()
  })
}
