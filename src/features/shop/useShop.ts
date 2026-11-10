import { useEffect, useState } from "react"
import { subscribeRubies } from "./rubies"
import { EMPTY_SHOP, loadShop, type ShopState } from "./shop"

// Inventory and weekly recap. Reloads whenever rubies change (earning or
// spending both go through reloadRubies, which notifies). `ready` turns true
// after the first read, so pages can show a skeleton until then.
export function useShop(): { state: ShopState; ready: boolean } {
  const [state, setState] = useState<ShopState>(EMPTY_SHOP)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const load = () =>
      void loadShop().then((next) => {
        setState(next)
        setReady(true)
      })
    load()
    return subscribeRubies(load)
  }, [])

  return { state, ready }
}
