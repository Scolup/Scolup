// Petit bus « quelque chose de synchronisable a changé ». Les écritures
// locales (réglages, rubis, quêtes...) appellent markDirty() ; le moteur de
// synchronisation (cloudSync.ts) s'y abonne. Ce fichier n'importe rien, ce qui
// évite tout cycle entre le stockage et le moteur.
const listeners = new Set<() => void>()

export function markDirty(): void {
  console.debug("[sync] markDirty called")
  for (const listener of listeners) listener()
}

export function onDirty(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
