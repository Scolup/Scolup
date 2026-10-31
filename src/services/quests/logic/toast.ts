import type { QuestToast } from "../types"

export function toastText({ quests, text }: QuestToast): string {
  if (text) return text
  const total = quests.reduce((sum, quest) => sum + quest.reward, 0)
  const income = quests.every((quest) => quest.income)
  if (quests.length === 1) {
    return income
      ? `${quests[0].title} : +${total} rubis à récupérer`
      : `Quête accomplie : ${quests[0].title} (+${total} rubis à récupérer)`
  }
  return income
    ? `${quests.length} récompenses : +${total} rubis à récupérer`
    : `${quests.length} quêtes accomplies (+${total} rubis à récupérer)`
}
