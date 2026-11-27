import type {
  PromoCode,
  PromoReward,
  PromoStep,
  SimpleReward,
} from "./promoCodes"

// Chaque variable VITE_PROMO_* contient un code, voir .env.example.
// Une valeur invalide est ignorée avec un avertissement : une faute de frappe
// dans la configuration ne doit pas empêcher l'application de démarrer.

function simpleReward(text: string): SimpleReward | null {
  const [kind, first, second] = text.split(":")
  if (kind === "rubies" && first && Number.isFinite(Number(first)))
    return { kind: "rubies", amount: Number(first) }
  if (kind === "free" && first) return { kind: "free-item", itemId: first }
  if (kind === "price" && first && second && Number.isFinite(Number(second)))
    return { kind: "price", itemId: first, price: Number(second) }
  return null
}

function reward(text: string): PromoReward | null {
  if (!text.startsWith("bundle:")) return simpleReward(text)
  const rewards: SimpleReward[] = []
  for (const part of text.slice("bundle:".length).split(",")) {
    const entry = simpleReward(part)
    if (!entry) return null
    rewards.push(entry)
  }
  return rewards.length > 0 ? { kind: "bundle", rewards } : null
}

function step(fields: readonly string[]): PromoStep | null {
  const [text, message, hint] = fields
  const parsed = text ? reward(text) : null
  if (!parsed) return null
  return {
    reward: parsed,
    ...(message ? { message } : {}),
    ...(hint ? { hint } : {}),
  }
}

function promo(fields: readonly string[]): PromoCode | null {
  const [code, ...rest] = fields
  const first = step(rest)
  if (!code || !first) return null
  const parsed: PromoCode = { code, ...first }
  const extra = rest[3]
  if (extra?.startsWith("again:")) {
    const again = step(extra.slice("again:".length).split("~"))
    if (!again) return null
    parsed.again = again
  }
  return parsed
}

export function parsePromoCodes(
  env: Record<string, unknown>
): readonly PromoCode[] {
  const codes: PromoCode[] = []
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("VITE_PROMO_") || typeof value !== "string") continue
    const fields = value
      .split(/(?<!\\)\|/)
      .map((field) => field.trim().replace(/\\\|/g, "|"))
    const parsed = promo(fields)
    if (!parsed) {
      console.warn(`Code promo ignoré (${key}) : vérifie .env.example`)
      continue
    }
    codes.push(parsed)
  }
  return codes
}
