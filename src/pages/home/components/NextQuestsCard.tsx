import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { NextGoalsCard } from "@/components/NextGoalsCard"
import { triggerHapticLight } from "@/services/haptics"
import { useNextQuests } from "../hooks/useNextQuests"
import { getSyncStatus, onSyncStatus } from "@/services/cloudSync"

export function NextQuestsCard() {
  const navigate = useNavigate()
  const [offline, setOffline] = useState(() => getSyncStatus().offline)
  useEffect(() => onSyncStatus(() => setOffline(getSyncStatus().offline)), [])
  const quests = useNextQuests()

  if (offline) return null

  return (
    <NextGoalsCard
      quests={quests}
      onOpen={() => {
        triggerHapticLight()
        navigate("/rubis")
      }}
    />
  )
}
