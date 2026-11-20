import type {
  PromoCode,
  PromoStep,
  PromoReward,
} from "@/features/shop/promoCodes"

const API_URL = "https://api.scolup.com/codes"

interface ApiPromo {
  code: string
  reward: PromoReward
  message?: string | null
  hint?: string | null
  again?: PromoStep | null
  startsAt?: string | null
  endsAt?: string | null
}

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

// Les codes vivent dans la D1 `scolup-codes`, servis par api.scolup.com/codes.
export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const response = await fetch(API_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`promo_codes_http_${response.status}`)

  const data = (await response.json()) as ApiPromo[]
  if (!Array.isArray(data)) return []

  return data.flatMap((item): PromoCode[] => {
    if (typeof item?.code !== "string" || !item.reward) return []
    const startsAt = toDate(item.startsAt)
    const endsAt = toDate(item.endsAt)
    const promo: PromoCode = {
      code: item.code,
      reward: item.reward,
      message: item.message ?? undefined,
      hint: item.hint ?? undefined,
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    }
    if (item.again?.reward) {
      promo.again = {
        reward: item.again.reward,
        message: item.again.message ?? undefined,
        hint: item.again.hint ?? undefined,
      }
    }
    return [promo]
  })
}
