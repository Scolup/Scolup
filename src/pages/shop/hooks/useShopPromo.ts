import { useState } from "react"
import { promoPrice } from "@/features/shop/promoCodes"

const EMPTY = {
  itemId: "",
  code: "",
  appliedCode: "",
  price: null as number | null,
  error: "",
}

// Code promo state of the item drawer. The check is local and instant:
// typing a new code clears the previous verdict.
export function useShopPromo(itemId: string | undefined) {
  const [state, setState] = useState(EMPTY)
  const id = itemId ?? ""
  if (state.itemId !== id) setState({ ...EMPTY, itemId: id })
  const current = state.itemId === id ? state : EMPTY

  const setCode = (code: string) => {
    setState({ ...EMPTY, itemId: id, code })
  }
  const apply = () => {
    if (!itemId || !current.code.trim()) return
    const price = promoPrice(itemId, current.code)
    setState({
      ...current,
      itemId: id,
      price,
      appliedCode: price === null ? "" : current.code,
      error: price === null ? "Ce code ne s’applique pas à cet article." : "",
    })
  }
  return { ...current, setCode, apply }
}
