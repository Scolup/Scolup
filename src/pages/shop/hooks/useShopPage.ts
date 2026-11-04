import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useRubies } from "@/features/shop/useRubies"
import { useShop } from "@/features/shop/useShop"
import { useTheme } from "@/components/ThemeProvider"
import { triggerHapticLight } from "@/services/haptics"
import { buyItem } from "@/features/shop/shop"
import { getRubies } from "@/features/shop/rubies"
import {
  itemActive,
  itemOwned,
  SHOP_ITEMS,
  type ShopItem,
} from "@/features/shop/shopRules"
import type { ShopEntry } from "../shopLayout"

interface Notice {
  text: string
  tone: "success" | "error"
}

export function useShopPage() {
  const rubies = useRubies()
  const { state, ready } = useShop()
  const { accentColor, setAccentColor, decoTheme, setDecoTheme } = useTheme()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [params, setParams] = useSearchParams()
  // The home teaser links straight to an item: open its drawer on arrival.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    params.get("item")
  )

  const dismissNotice = useCallback(() => setNotice(null), [])

  // Memoized so the entry identities stay stable across unrelated renders
  // (the item dialog syncs its own copy of the open entry during render).
  const items: ShopEntry[] = useMemo(
    () =>
      SHOP_ITEMS.map((item) => ({
        item,
        owned: itemOwned(item, state.owned),
        active: itemActive(item, accentColor, decoTheme),
        missing: Math.max(0, item.price - rubies),
      })),
    [state.owned, accentColor, decoTheme, rubies]
  )

  // The dialog entry derives from items, so a purchase re-renders it live.
  const selected: ShopEntry | null = selectedId
    ? (items.find((entry) => entry.item.id === selectedId) ?? null)
    : null
  const select = useCallback((item: ShopItem) => {
    triggerHapticLight()
    setSelectedId(item.id)
  }, [])
  const deselect = useCallback(() => {
    setSelectedId(null)
    if (params.has("item")) setParams({ tab: "boutique" }, { replace: true })
  }, [params, setParams])

  // The dialog disables the purchase while the balance is short, so the
  // toast only fires on a race (getRubies reads the live balance).
  const buy = useCallback(async (item: ShopItem) => {
    const status = await buyItem(item.id)
    triggerHapticLight()
    if (status === "ok") {
      const what =
        item.kind === "theme"
          ? `Thème ${item.label} débloqué`
          : `Couleur ${item.label} débloquée`
      setNotice({ text: `${what} !`, tone: "success" })
    } else if (status === "poor") {
      const missing = Math.max(0, item.price - getRubies())
      setNotice({ text: `Il te manque ${missing} rubis.`, tone: "error" })
    } else if (status !== "owned") {
      setNotice({ text: "Achat impossible pour le moment.", tone: "error" })
    }
  }, [])

  const use = useCallback(
    (item: ShopItem) => {
      triggerHapticLight()
      // Using the active theme picks it back off: the pages return to normal.
      if (item.kind === "theme") {
        setDecoTheme(decoTheme === item.value ? "" : item.value)
        return
      }
      setAccentColor(item.value)
    },
    [decoTheme, setAccentColor, setDecoTheme]
  )

  return {
    ready,
    items,
    selected,
    select,
    deselect,
    notice,
    dismissNotice,
    buy,
    use,
  }
}
