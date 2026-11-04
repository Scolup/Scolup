import { useQuests } from "@/features/quests/useQuests"
import { nextQuests } from "@/features/quests/highlight"

// The few quests the student is closest to finishing (see nextQuests).
export function useNextQuests() {
  const { quests } = useQuests()
  return nextQuests(quests)
}
