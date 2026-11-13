import {
  isFound,
  isLive,
  normalizeCode,
  PROMO_CODES,
  type PromoCode,
  type PromoReward,
} from "./promoCodes"
import type { Wallet } from "./wallet"

export interface FoundCode {
  code: string
  reward: PromoReward
}

export interface VaultHint {
  text: string
  length: number // nombre de caractères du code : sa « forme »
}

// Ce que le coffre de José sait de l'élève : ce qu'il a trouvé, combien il en
// reste et de quoi le mettre sur la piste (jamais le code lui-même).
export interface VaultState {
  total: number
  found: FoundCode[]
  hints: VaultHint[]
}

export const EMPTY_VAULT: VaultState = { total: 0, found: [], hints: [] }

export function buildVault(
  wallet: Wallet,
  now: Date,
  promos: readonly PromoCode[] = PROMO_CODES
): VaultState {
  const found: FoundCode[] = []
  const hints: VaultHint[] = []
  let total = 0
  for (const promo of promos) {
    const isOpen = isFound(wallet, promo)
    // Un code trouvé reste dans la collection même une fois expiré.
    if (!isOpen && !isLive(promo, now)) continue
    total++
    if (isOpen) {
      found.push({ code: promo.code, reward: promo.reward })
    } else if (promo.hint) {
      hints.push({ text: promo.hint, length: normalizeCode(promo.code).length })
    }
  }
  return { total, found, hints }
}
