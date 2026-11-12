// Le portefeuille de rubis, pensé pour être fusionné entre appareils.
//
// On ne stocke pas un solde mais des FAITS qui ne font que s'ajouter :
//   earned   une récompense gagnée (id déterministe : deux appareils qui
//            gagnent la même créent le même id, elle n'est donc comptée qu'une fois)
//   claimed  les récompenses déjà créditées au solde
//   spent    ce qu'a coûté chaque objet acheté
//   gifts    les ajouts manuels (console __giveRubis)
// Fusionner deux portefeuilles = faire l'union de chaque table. Le résultat ne
// dépend ni de l'ordre ni du nombre de fusions.
//
// Pur : pas de React, pas d'IndexedDB.

export interface Earned {
  a: number // montant
  w: string // clé de semaine (lundi) : sert aux stats hebdomadaires
}

export interface Wallet {
  earned: Record<string, Earned>
  claimed: Record<string, true>
  spent: Record<string, number>
  gifts: Record<string, number>
}

export const WALLET_KEY = "wallet"
const KEPT_WEEKS = 12

function emptyWallet(): Wallet {
  return { earned: {}, claimed: {}, spent: {}, gifts: {} }
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

// Relit un portefeuille venant du disque ou d'un autre appareil : tout ce qui
// n'a pas la bonne forme est ignoré.
export function parseWallet(raw: unknown): Wallet {
  const wallet = emptyWallet()
  if (!isRecord(raw)) return wallet
  if (isRecord(raw.earned)) {
    for (const [id, entry] of Object.entries(raw.earned)) {
      if (isRecord(entry) && typeof entry.w === "string") {
        wallet.earned[id] = { a: toCount(entry.a), w: entry.w }
      }
    }
  }
  if (isRecord(raw.claimed)) {
    for (const [id, flag] of Object.entries(raw.claimed)) {
      if (flag === true) wallet.claimed[id] = true
    }
  }
  for (const table of ["spent", "gifts"] as const) {
    const source = raw[table]
    if (!isRecord(source)) continue
    for (const [id, amount] of Object.entries(source)) {
      wallet[table][id] = toCount(amount)
    }
  }
  return wallet
}

// ---- Fusion ----------------------------------------------------------------

function maxByKey<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  pick: (x: T, y: T) => T
): Record<string, T> {
  const out: Record<string, T> = { ...a }
  for (const [key, value] of Object.entries(b)) {
    out[key] = key in out ? pick(out[key], value) : value
  }
  return out
}

// Un même id porte normalement toujours le même montant. S'il diverge malgré
// tout (migration, fichier modifié à la main), on garde le plus grand : c'est
// encore commutatif, associatif et idempotent.
export function mergeWallets(a: Wallet, b: Wallet): Wallet {
  return {
    earned: maxByKey(a.earned, b.earned, (x, y) => ({
      a: Math.max(x.a, y.a),
      w: x.w >= y.w ? x.w : y.w,
    })),
    claimed: { ...a.claimed, ...b.claimed },
    spent: maxByKey(a.spent, b.spent, Math.max),
    gifts: maxByKey(a.gifts, b.gifts, Math.max),
  }
}

// ---- Lecture ---------------------------------------------------------------

function sum(values: Iterable<number>): number {
  let total = 0
  for (const value of values) total += value
  return total
}

// Peut être négatif : deux appareils hors ligne ont pu dépenser les mêmes
// rubis. La boutique refuse tout achat tant que le solde < prix, donc cela se
// résorbe ; l'affichage, lui, est ramené à 0 (voir rubies.ts).
export function balanceOf(wallet: Wallet): number {
  const credited = Object.entries(wallet.earned)
    .filter(([id]) => wallet.claimed[id])
    .map(([, entry]) => entry.a)
  return (
    sum(credited) +
    sum(Object.values(wallet.gifts)) -
    sum(Object.values(wallet.spent))
  )
}

export function pendingOf(wallet: Wallet): number {
  return sum(
    Object.entries(wallet.earned)
      .filter(([id]) => !wallet.claimed[id])
      .map(([, entry]) => entry.a)
  )
}

export function ownedOf(wallet: Wallet): string[] {
  return Object.keys(wallet.spent)
}

// Rubis gagnés par semaine (les 12 dernières), déduits des récompenses.
export function weeksOf(wallet: Wallet): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const entry of Object.values(wallet.earned)) {
    totals[entry.w] = (totals[entry.w] ?? 0) + entry.a
  }
  const keep = Object.keys(totals).sort().slice(-KEPT_WEEKS)
  return Object.fromEntries(keep.map((week) => [week, totals[week]]))
}

export function hasEarned(wallet: Wallet, id: string): boolean {
  return id in wallet.earned
}

// ---- Écriture (renvoie un nouveau portefeuille) ----------------------------

export function earn(
  wallet: Wallet,
  id: string,
  amount: number,
  week: string
): Wallet {
  if (hasEarned(wallet, id)) return wallet
  return {
    ...wallet,
    earned: { ...wallet.earned, [id]: { a: toCount(amount), w: week } },
  }
}

export function claimAll(wallet: Wallet): Wallet {
  const claimed = { ...wallet.claimed }
  for (const id of Object.keys(wallet.earned)) claimed[id] = true
  return { ...wallet, claimed }
}

export function spend(wallet: Wallet, itemId: string, price: number): Wallet {
  if (itemId in wallet.spent) return wallet
  return { ...wallet, spent: { ...wallet.spent, [itemId]: toCount(price) } }
}

function give(wallet: Wallet, id: string, amount: number): Wallet {
  return { ...wallet, gifts: { ...wallet.gifts, [id]: toCount(amount) } }
}

// ---- Ancien format (une seule fois) ----------------------------------------
// Avant : "rubies" et "pending" (nombres), "owned" (JSON), "weekly" (JSON).
// Le solde devient un cadeau d'id "legacy", les récompenses en attente une
// récompense d'id "legacy-pending", chaque objet possédé un achat à 0. Deux
// appareils migrés séparément partagent ces ids : la fusion garde le plus grand.
export interface LegacyShop {
  rubies?: unknown
  pending?: unknown
  owned?: unknown
}

export function walletFromLegacy(legacy: LegacyShop): Wallet {
  let wallet = emptyWallet()
  const rubies = toCount(legacy.rubies)
  if (rubies > 0) wallet = give(wallet, "legacy", rubies)
  const pending = toCount(legacy.pending)
  if (pending > 0) wallet = earn(wallet, "legacy-pending", pending, "legacy")
  try {
    const owned: unknown =
      typeof legacy.owned === "string" ? JSON.parse(legacy.owned) : []
    if (Array.isArray(owned)) {
      for (const id of owned) {
        if (typeof id === "string") wallet = spend(wallet, id, 0)
      }
    }
  } catch {
    // Inventaire illisible : on repart sans.
  }
  return wallet
}
