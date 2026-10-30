import { useQuests } from "@/hooks/use-quests"
import { nextQuests } from "@/services/quest-rules"

// The few quests the student is closest to finishing (see nextQuests).
export function useNextQuests() {
  const { quests } = useQuests()
  return nextQuests(quests)
}
