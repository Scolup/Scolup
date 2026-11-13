import { hasEarned, type Wallet } from "./wallet"

export type SimpleReward =
  | { kind: "rubies"; amount: number }
  | { kind: "free-item"; itemId: string }
  | { kind: "price"; itemId: string; price: number }

export type PromoReward =
  | SimpleReward
  | { kind: "bundle"; rewards: readonly SimpleReward[] }

export interface PromoCode {
  code: string
  reward: PromoReward
  // Ce que José dit quand l'élève trouve le code (sinon une phrase générique).
  message?: string
  // Un indice volontairement vague : José le glisse quand on le touche avec le
  // champ vide. Sans indice, le code reste un pur secret.
  hint?: string
  // Fenêtre de disponibilité (heure locale), comme les articles de la boutique :
  // hors de la fenêtre, le code n'existe plus pour José.
  startsAt?: Date
  endsAt?: Date
}

// Codes en clair : ajoute un objet à la liste (le code tel que l'élève le
// tape — insensible à la casse — et sa récompense). Ils sont lisibles dans le
// bundle livré, et le portefeuille reste local : un code n'est qu'une surprise,
// jamais un secret. Récompenses possibles : des rubis, un article offert, un
// article à prix réduit (retenu dans le portefeuille jusqu'à l'achat), ou
// plusieurs à la fois (`bundle`).
// NOTE: les `hint` et `message` ci-dessous sont des textes provisoires : à
// réécrire pour coller à l'origine réelle de chaque code.
export const PROMO_CODES: readonly PromoCode[] = [
  {
    code: "JOSEJOSE",
    reward: { kind: "rubies", amount: 50 },
    message: "Mon prénom, deux fois ! Personne n’avait osé.",
    hint: "Un prénom que je ne me lasse pas d’entendre… surtout deux fois de suite.",
  },
  {
    code: "SRY6",
    reward: { kind: "price", itemId: "theme-halloween2026", price: 67 },
    message: "Désolés de t'avoir volé.",
  },
  {
    code: "EVOMOYENNE-OG",
    reward: {
      kind: "bundle",
      rewards: [
        { kind: "rubies", amount: 100 },
        { kind: "free-item", itemId: "theme-evomoyenne" },
      ],
    },
    message: "Merci d'être là depuis le début.",
  },
  {
    code: "67",
    reward: { kind: "rubies", amount: 0 },
    message: "gênant",
  },
  {
    code: "QWERTYUIOP",
    reward: { kind: "rubies", amount: 25 },
    message: "Tu es anglais ?",
    hint: "Clavier anglais...",
  },
]

export function normalizeCode(code: string): string {
  return code.trim().normalize("NFC").toUpperCase()
}

export function findPromo(
  code: string,
  promos: readonly PromoCode[] = PROMO_CODES
): PromoCode | null {
  const normalized = normalizeCode(code)
  if (!normalized) return null
  return (
    promos.find((promo) => normalizeCode(promo.code) === normalized) ?? null
  )
}

// Id du fait enregistré dans le portefeuille pour un code de rubis.
export function promoId(promo: PromoCode): string {
  return `promo:${promo.code}`
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

// Un code est « trouvé » quand le portefeuille porte déjà tous ses effets :
// c'est ce qui le rend utilisable une seule fois, même d'un appareil à l'autre.
export function isFound(wallet: Wallet, promo: PromoCode): boolean {
  return rewardsOf(promo.reward).every((reward) => {
    if (reward.kind === "rubies") return hasEarned(wallet, promoId(promo))
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

// Les codes encore à trouver : ceux que José peut deviner ou souffler.
export function huntable(
  wallet: Wallet,
  now: Date,
  promos: readonly PromoCode[] = PROMO_CODES
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
