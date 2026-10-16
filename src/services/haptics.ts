import { getSettingSync } from "./storage"

// Toute vibration passe par ici, jamais `navigator.vibrate` en direct.
// Respecte le réglage "Vibrations" (défaut : activé) et ne fait rien là où
// l'API n'existe pas (iOS, desktop) : le visuel reste le canal principal.
export function hapticsEnabled(): boolean {
  return getSettingSync("haptics") !== false
}

function buzz(pattern: number | number[]): void {
  if (!hapticsEnabled()) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // ponytail: la vibration est un bonus, jamais critique.
  }
}

// Sélection, navigation et coche d'un devoir.
export function triggerHapticLight(): void {
  buzz(10)
}

// Confirmation d'une action réussie (envoi d'un message ou commentaire).
export function triggerHapticMedium(): void {
  buzz([15, 40, 15])
}
