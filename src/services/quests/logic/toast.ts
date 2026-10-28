import type { QuestToast } from "../types"

export function toastText({ quests, text }: QuestToast): string {
  if (text) return text
  const total = quests.reduce((sum, quest) => sum + quest.reward, 0)
  const income = quests.every((quest) => quest.income)
  if (quests.length === 1) {
    return income
      ? `${quests[0].title} : +${total} rubis`
      : `Quête accomplie : ${quests[0].title} (+${total} rubis)`
  }
  return income
    ? `${quests.length} récompenses : +${total} rubis`
    : `${quests.length} quêtes accomplies (+${total} rubis)`
}
