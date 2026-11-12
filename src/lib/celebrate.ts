// Petit bus pour les moments forts (rubis récupérés, achat réussi) : n'importe
// quel écran appelle `celebrate()`, MainLayout écoute et joue l'animation
// (RewardBurst). Même principe que subscribeQuestToast, sans dépendre des quêtes.
const listeners = new Set<() => void>()

export function celebrate(): void {
  for (const listener of listeners) listener()
}

export function subscribeCelebrate(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
