export type PromoReward =
  | { kind: "rubies"; amount: number }
  | { kind: "free-item"; itemId: string }
  | { kind: "price"; itemId: string; price: number }

export interface PromoCode {
  code: string
  reward: PromoReward
}

// Codes en clair : ajoute un objet à la liste (le code tel que l'élève le
// tape — insensible à la casse — et sa récompense). Ils sont lisibles dans le
// bundle livré, et le portefeuille reste local : un code n'est qu'une surprise,
// jamais un secret. Trois récompenses possibles : des rubis, un article offert,
// ou un article à prix réduit (retenu dans le portefeuille jusqu'à l'achat).
const PROMO_CODES: readonly PromoCode[] = [
  {
    code: "JOSEJOSE",
    reward: { kind: "rubies", amount: 50 },
  },
  {
    code: "SRY6",
    reward: { kind: "price", itemId: "theme-halloween2026", price: 67 },
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
