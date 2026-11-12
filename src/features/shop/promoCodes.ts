export interface PromoCode {
  itemId: string
  code: string
  price: number
}

// Codes en clair : ajoute un objet à la liste (id de l'article, code tel que
// l'élève le tape — insensible à la casse — et prix en rubis). Ils sont
// lisibles dans le bundle livré, et le portefeuille reste local : un code
// n'est qu'une surprise, jamais un secret.
const PROMO_CODES: readonly PromoCode[] = [
  {
    itemId: "theme-halloween2026",
    code: "SRY6",
    price: 67,
  },
]

export function promoPrice(
  itemId: string,
  code: string,
  promos: readonly PromoCode[] = PROMO_CODES
): number | null {
  const normalized = code.trim().normalize("NFC").toUpperCase()
  if (!normalized) return null
  const promo = promos.find(
    (promo) =>
      promo.itemId === itemId &&
      promo.code.trim().normalize("NFC").toUpperCase() === normalized
  )
  return promo && Number.isSafeInteger(promo.price) && promo.price >= 0
    ? promo.price
    : null
}
