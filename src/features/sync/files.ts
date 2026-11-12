// Noms des fichiers de synchronisation dans le cloud : un par appareil,
// `sync-<deviceId>.json`. Chaque appareil n'écrit QUE le sien, donc deux
// appareils ne s'écrasent jamais. Pur : pas de réseau, pas de stockage.

export const SYNC_FOLDER = ".scolup"

export function syncFileName(deviceId: string): string {
  return `sync-${deviceId}.json`
}

// Tolère le suffixe " (1)" que le cloud pourrait ajouter si un envoi sous un
// nom existant créait un doublon au lieu d'écraser.
function deviceIdOf(libelle: string): string | null {
  const match = /^sync-([a-z0-9]{8,32})(?: \(\d+\))?\.json$/.exec(libelle)
  return match ? match[1] : null
}

// Regroupe les fichiers par appareil, le plus récent en premier. S'il y a
// plusieurs fichiers pour un appareil, le premier est le bon, les autres sont
// des doublons.
export function groupByDevice<T extends { libelle: string; date: string }>(
  files: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const file of files) {
    const id = deviceIdOf(file.libelle)
    if (!id) continue
    const list = groups.get(id) ?? []
    list.push(file)
    groups.set(id, list)
  }
  for (const list of groups.values()) {
    list.sort((a, b) =>
      a.date !== b.date
        ? a.date < b.date
          ? 1
          : -1
        : a.libelle < b.libelle
          ? -1
          : 1
    )
  }
  return groups
}
