import { useEffect, useMemo, useState } from "react"
import { loadQuestState, subscribeQuests } from "@/services/quests"
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
  tier?: number
}

interface QuestSnapshot {
  progress: ProgressMap
  generated: QuestDef[]
  hideGrades: boolean
}

const EMPTY: QuestSnapshot = { progress: {}, generated: [], hideGrades: false }

// Read-only: pages that want to *trigger* a quest call track() directly.
// Returns the quests that are active today, without the income rules (those
// pay automatically: see INCOME in the shop) and without grade quests when
// the student turned them off.
export function useQuests(): { quests: QuestItem[]; hideGrades: boolean } {
  const [snapshot, setSnapshot] = useState<QuestSnapshot>(EMPTY)

  useEffect(() => {
    const load = () => void loadQuestState().then(setSnapshot)
    load()
    return subscribeQuests(load)
  }, [])

  return useMemo(() => {
    const now = new Date()
    const quests = activeQuests(
      [...QUESTS, ...snapshot.generated],
      now,
      snapshot.hideGrades
    )
      .filter((quest) => !quest.income)
      .map((quest) => ({
        ...quest,
        period: questPeriod(quest),
        ...questView(quest, snapshot.progress, now),
      }))
    return { quests, hideGrades: snapshot.hideGrades }
  }, [snapshot])
}
