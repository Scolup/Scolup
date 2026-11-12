import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQuests } from "@/features/quests/useQuests"
import { usePendingRubies, useRubies } from "@/features/shop/useRubies"
import { useShop } from "@/features/shop/useShop"
import { triggerHapticLight } from "@/services/haptics"
import { celebrate } from "@/lib/celebrate"
import { claimRubies } from "@/features/shop/rubies"
import { periodKey } from "@/features/quests/period"
import { weekSummary } from "@/features/shop/shopRules"
import { groupQuests } from "../groupQuests"

interface Notice {
  text: string
  tone: "success" | "error"
}

function lastWeekKey(): string {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return periodKey("weekly", date)
}

export function useRubisPage() {
  const navigate = useNavigate()
  const rubies = useRubies()
  const pending = usePendingRubies()
  const { quests, hideGrades } = useQuests()
  const { state } = useShop()
  const [notice, setNotice] = useState<Notice | null>(null)

  const goBack = useCallback(() => navigate(-1), [navigate])
  const dismissNotice = useCallback(() => setNotice(null), [])

  const { groups, achieved } = useMemo(() => groupQuests(quests), [quests])
  const weekRubies = useMemo(
    () =>
      weekSummary(state.weeks, periodKey("weekly", new Date()), lastWeekKey())
        .thisWeek,
    [state.weeks]
  )

  const claim = useCallback(async () => {
    const amount = await claimRubies()
    if (amount <= 0) return
    triggerHapticLight()
    celebrate()
    setNotice({ text: `+${amount} rubis récupérés !`, tone: "success" })
  }, [])

  return {
    rubies,
    pending,
    groups,
    achieved,
    hideGrades,
    weekRubies,
    notice,
    dismissNotice,
    goBack,
    claim,
  }
}
