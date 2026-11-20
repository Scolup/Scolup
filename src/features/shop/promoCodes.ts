import { hasEarned, type Wallet } from "./wallet"

export type SimpleReward =
  | { kind: "rubies"; amount: number }
  | { kind: "free-item"; itemId: string }
  | { kind: "price"; itemId: string; price: number }

export type PromoReward =
  | SimpleReward
  | { kind: "bundle"; rewards: readonly SimpleReward[] }

export interface PromoStep {
  reward: PromoReward
  // Ce que José dit quand l'élève valide cette étape (sinon une phrase
  // générique).
  message?: string
  // Un indice volontairement vague : José le glisse quand on le touche avec le
  // champ vide. Sans indice, le code reste un pur secret. Texte simple, rendu
  // par RichHtml : `<strong>` pour appuyer un mot.
  hint?: string
}

export interface PromoCode extends PromoStep {
  code: string
  // Une seconde étape, pour un code qui se répète : la même clé reste
  // utilisable tant qu'elle n'est pas validée, avec son propre indice et sa
  // propre récompense.
  again?: PromoStep
  // Fenêtre de disponibilité (heure locale), comme les articles de la boutique :
  // hors de la fenêtre, le code n'existe plus pour José.
  startsAt?: Date
  endsAt?: Date
}

export function normalizeCode(code: string): string {
  return code.trim().normalize("NFC").toUpperCase()
}

export function findPromo(
  code: string,
  promos: readonly PromoCode[]
): PromoCode | null {
  const normalized = normalizeCode(code)
  if (!normalized) return null
  return (
    promos.find((promo) => normalizeCode(promo.code) === normalized) ?? null
  )
}

// Id du fait enregistré dans le portefeuille pour une étape de code.
export function promoId(promo: PromoCode, step = 0): string {
  const base = `promo:${promo.code}`
  return step === 0 ? base : `${base}:${step}`
}

// Les étapes d'un code, dans l'ordre où elles s'ouvrent.
export function stepsOf(promo: PromoCode): readonly PromoStep[] {
  const first: PromoStep = {
    reward: promo.reward,
    message: promo.message,
    hint: promo.hint,
  }
  return promo.again ? [first, promo.again] : [first]
}

export function isLive(promo: PromoCode, now: Date): boolean {
  if (promo.startsAt && now < promo.startsAt) return false
  if (promo.endsAt && now >= promo.endsAt) return false
  return true
}

// Les récompenses simples d'un code : le bundle est aplati, l'appelant n'a
// jamais à traiter les deux formes.
export function rewardsOf(reward: PromoReward): readonly SimpleReward[] {
  return reward.kind === "bundle" ? reward.rewards : [reward]
}

function stepFound(
  wallet: Wallet,
  promo: PromoCode,
  step: PromoStep,
  index: number
): boolean {
  return rewardsOf(step.reward).every((reward) => {
    if (reward.kind === "rubies")
      return hasEarned(wallet, promoId(promo, index))
    if (reward.kind === "free-item") return reward.itemId in wallet.spent
    // For price codes: new format stores in coupons, old format in spent
    // Check coupons (new format) first, then fall back to spent (old format)
    // If spent price <= promo price, the code was likely used
    return (
      reward.itemId in wallet.coupons ||
      (reward.itemId in wallet.spent &&
        wallet.spent[reward.itemId] <= reward.price)
    )
  })
}

// L'étape que le coffre attend : la première que l'élève n'a pas encore
// validée. `null` quand le code a été trouvé en entier.
export function openStep(
  wallet: Wallet,
  promo: PromoCode
): { step: PromoStep; index: number } | null {
  const steps = stepsOf(promo)
  for (let index = 0; index < steps.length; index++) {
    if (!stepFound(wallet, promo, steps[index], index)) {
      return { step: steps[index], index }
    }
  }
  return null
}

// Un code est « trouvé » quand toutes ses étapes sont validées : c'est ce qui
// le rend utilisable une seule fois, même d'un appareil à l'autre.
export function isFound(wallet: Wallet, promo: PromoCode): boolean {
  return openStep(wallet, promo) === null
}

// Les codes encore à trouver : ceux que José peut deviner ou souffler.
export function huntable(
  wallet: Wallet,
  now: Date,
  promos: readonly PromoCode[]
): PromoCode[] {
  return promos.filter((promo) => isLive(promo, now) && !isFound(wallet, promo))
}

// Distance d'édition (insertion, suppression, remplacement d'un caractère).
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = row
  }
  return previous[b.length]
}

// « Tu chauffes » : à une faute de frappe d'un code (deux pour les longs), ou
// le début d'un code. Trois caractères minimum, sinon n'importe quoi chauffe.
export function isNearMiss(
  input: string,
  candidates: readonly PromoCode[]
): boolean {
  const typed = normalizeCode(input)
  if (typed.length < 3) return false
  return candidates.some((promo) => {
    const target = normalizeCode(promo.code)
    if (typed === target) return false
    if (target.startsWith(typed)) return true
    return distance(typed, target) <= (target.length >= 6 ? 2 : 1)
  })
}
