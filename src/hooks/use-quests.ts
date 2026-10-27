import { useEffect, useMemo, useState } from "react"
import { loadQuestProgress, subscribeQuests } from "@/services/quests"
import {
  activeQuests,
  QUESTS,
  questPeriod,
  questView,
  type ProgressMap,
  type QuestDef,
  type QuestPeriod,
  type QuestState,
} from "@/services/quest-rules"

export interface QuestItem extends QuestDef {
  period: QuestPeriod
  state: QuestState
  count: number
  goal: number
}

// Read-only: pages that want to *trigger* a quest call track() directly.
// Returns only the quests that are active today (pools rotate).
export function useQuests(): QuestItem[] {
  const [progress, setProgress] = useState<ProgressMap>({})

  useEffect(() => {
    const load = () => void loadQuestProgress().then(setProgress)
    load()
    return subscribeQuests(load)
  }, [])

  return useMemo(() => {
    const now = new Date()
    return activeQuests(QUESTS, now).map((quest) => ({
      ...quest,
      period: questPeriod(quest),
      ...questView(quest, progress, now),
    }))
  }, [progress])
}
