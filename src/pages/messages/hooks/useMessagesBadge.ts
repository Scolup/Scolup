import { useEffect } from "react"
import { ld } from "@/services/linkdirecte"

import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { MESSAGE_YEAR } from "../helpers"
import { countUnreadMessages, toMessage } from "../helpers"
import type { MessageEntry } from "../helpers"
import {
  seedUnreadMessagesCount,
  setUnreadMessagesCount,
  useUnreadMessagesCount,
} from "../unreadCount"

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 4000

export function useMessagesBadge(): number | null {
  const count = useUnreadMessagesCount()
  const liveMessages = useLiveRefresh("messages")

  useEffect(() => {
    let cancelled = false
    // The first run only seeds the count, so it never fights a value the
    // messages page already published. Later runs are live refreshes and do
    // overwrite it.
    const seed = liveMessages === 0
    ;(async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        }
        if (cancelled) return
        try {
          if (!(await ld.auth.loadSession())) continue
          const result = await ld.messages.getMessages({ year: MESSAGE_YEAR })
          if (cancelled) return
          const messages = result.messages as
            | { received?: MessageEntry[] }
            | undefined
          const next = countUnreadMessages(
            (messages?.received ?? []).map(toMessage)
          )
          if (seed) seedUnreadMessagesCount(next)
          else setUnreadMessagesCount(next)
          return
        } catch (err) {
          console.warn("Messages : impossible de charger le badge.", err)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [liveMessages])

  return count
}
