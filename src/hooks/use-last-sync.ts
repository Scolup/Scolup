// Heure de la dernière synchro réussie, dérivée de l'état Lowdirecte
// existant (`ld.sync`). Aucune requête réseau ajoutée.
export function syncTimeLabel(lastSync: number | null): string | null {
  if (!lastSync) return null
  const time = new Date(lastSync).toLocaleTimeString("fr-FR", {
    hour: "numeric",
    minute: "2-digit",
  })
  return `Dernière mise à jour à ${time}`
}
