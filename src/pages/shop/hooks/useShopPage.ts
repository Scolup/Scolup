import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQuests } from "@/hooks/use-quests"
import { usePendingRubies, useRubies } from "@/hooks/use-rubies"
import { useShop } from "@/hooks/use-shop"
import { triggerHapticLight } from "@/services/haptics"
import { claimRubies } from "@/services/rubies"
import { periodKey } from "@/services/quest-rules"
import { buyItem } from "@/services/shop"
import {
  SHOP_ITEMS,
  weekMessage,
  weekSummary,
  type ShopItem,
} from "@/services/shop-rules"
import { useTheme } from "@/ui/theme-provider"
import { groupQuests } from "../helpers"

interface Notice {
  text: string
  tone: "success" | "error"
}

function lastWeekKey(): string {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return periodKey("weekly", date)
}

export function useShopPage() {
  const navigate = useNavigate()
  const rubies = useRubies()
  const pending = usePendingRubies()
  const { quests, hideGrades } = useQuests()
  const shop = useShop()
  const { accentColor, setAccentColor } = useTheme()
  const [notice, setNotice] = useState<Notice | null>(null)

  const goBack = useCallback(() => navigate(-1), [navigate])
  const dismissNotice = useCallback(() => setNotice(null), [])

  const { groups, achieved } = useMemo(() => groupQuests(quests), [quests])
  const weekText = useMemo(
    () =>
      weekMessage(
        weekSummary(shop.weeks, periodKey("weekly", new Date()), lastWeekKey())
      ),
    [shop.weeks]
  )

  const items = SHOP_ITEMS.map((item) => ({
    item,
    owned: shop.owned.includes(item.id),
    active: accentColor === item.value,
    missing: Math.max(0, item.price - rubies),
  }))

  const buy = useCallback(async (item: ShopItem) => {
    const status = await buyItem(item.id)
    triggerHapticLight()
    if (status === "ok") {
      setNotice({ text: `Thème ${item.label} débloqué !`, tone: "success" })
    } else if (status === "poor") {
      setNotice({ text: "Pas encore assez de rubis.", tone: "error" })
    } else if (status !== "owned") {
      setNotice({ text: "Achat impossible pour le moment.", tone: "error" })
    }
  }, [])

  const use = useCallback(
    (item: ShopItem) => {
      triggerHapticLight()
      setAccentColor(item.value)
    },
    [setAccentColor]
  )

  const claim = useCallback(async () => {
    const amount = await claimRubies()
    if (amount <= 0) return
    triggerHapticLight()
    setNotice({ text: `+${amount} rubis récupérés !`, tone: "success" })
  }, [])

  return {
    rubies,
    pending,
    groups,
    achieved,
    hideGrades,
    weekText,
    items,
    notice,
    dismissNotice,
    goBack,
    buy,
    use,
    claim,
  }
}
