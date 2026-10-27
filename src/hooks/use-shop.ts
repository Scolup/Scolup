import { useEffect, useState } from "react"
import { subscribeRubies } from "@/services/rubies"
import { EMPTY_SHOP, loadShop, type ShopState } from "@/services/shop"

// Inventory and weekly recap. Reloads whenever rubies change (earning or
// spending both go through reloadRubies, which notifies).
export function useShop(): ShopState {
  const [state, setState] = useState<ShopState>(EMPTY_SHOP)

  useEffect(() => {
    const load = () => void loadShop().then(setState)
    load()
    return subscribeRubies(load)
  }, [])

  return state
}
