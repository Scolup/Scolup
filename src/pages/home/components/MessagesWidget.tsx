"use client"

import { useMemo } from "react"
import { useNavigate } from "react-router"
import { formatDistanceToNowStrict } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { useState } from "react"
import { MailOpen01Icon } from "@hugeicons/core-free-icons"
import { ld } from "@/services/litedirecte"
import { useAsync } from "@/hooks/use-async"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import { MESSAGE_YEAR } from "@/pages/messages/helpers"
import { toMessage } from "@/pages/messages/helpers"
import type { Message, MessageEntry } from "@/pages/messages/helpers"
import { WidgetSkeleton } from "@/pages/home/components/WidgetSkeleton"
import { WidgetEmpty, WidgetError } from "@/pages/home/components/WidgetState"
import { useSplashTask } from "@/services/splash"

const NO_MESSAGES: Message[] = []

export function MessagesWidget() {
  const navigate = useNavigate()
  const [reloadKey, setReloadKey] = useState(0)
  const liveMessages = useLiveRefresh("messages")
  const { data, error, loading } = useAsync(async () => {
    if (!(await ld.auth.loadSession())) throw new Error("no session")
    const result = await ld.messages.getMessages({ year: MESSAGE_YEAR })
    const received = (result.messages as { received?: MessageEntry[] })
      ?.received
    return (Array.isArray(received) ? received : []).map(toMessage)
  }, [liveMessages, reloadKey])

  const unread = useMemo(
    () =>
      (data ?? NO_MESSAGES)
        .filter((message) => message.unread)
        .sort((a, b) => (b.time?.getTime() ?? 0) - (a.time?.getTime() ?? 0))
        .slice(0, 3),
    [data]
  )

  useSplashTask(loading)
  const showSkeleton = useDelayedLoading(loading)

  if (error)
    return <WidgetError onRetry={() => setReloadKey((key) => key + 1)} />
  if (loading) {
    if (!showSkeleton) {
      return (
        <section
          aria-hidden="true"
          className="min-h-[76px] rounded-3xl border border-border/70 bg-card"
        />
      )
    }
    return <WidgetSkeleton />
  }
  if (unread.length === 0)
    return (
      <WidgetEmpty
        icon={MailOpen01Icon}
        title="Tout est lu"
        hint="Tu n'as aucun message non lu."
      />
    )

  return (
    <section
      aria-label="Messages non lus"
      className="flex flex-col gap-1.5 rounded-3xl border border-border/70 bg-card p-4"
    >
      {unread.map((message) => (
        <button
          key={message.id}
          type="button"
          onClick={() => navigate(`/messages?message=${message.id}`)}
          className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-input/50 px-3.5 py-2.5 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-text"
          >
            {message.initials ?? "?"}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {message.subject || "Sans objet"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {message.sender}
              {message.time instanceof Date &&
                ` · ${formatDistanceToNowStrict(message.time, { addSuffix: true, locale: fr })}`}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full bg-unread"
          />
        </button>
      ))}
    </section>
  )
}
