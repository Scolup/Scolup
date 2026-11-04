// Réglages partagés entre appareils. Tout le reste reste propre à l'appareil
// (retours haptiques, vue d'agenda, étape d'onboarding, cache de mise à jour...).
const SYNCED_SETTINGS = new Set([
  "theme",
  "accent-color",
  "deco-theme",
  "gradesAverageMethod",
  "gradesAverageScale",
  "hideGradeQuests",
])

export function isSyncedSetting(key: string): boolean {
  return SYNCED_SETTINGS.has(key) || key.startsWith("seen:")
}

// Émis sur `window` quand la synchronisation a modifié des réglages : les
// composants qui les ont déjà lus (thème, accent...) se relisent.
export const SETTINGS_SYNCED_EVENT = "scolup:settings-synced"
