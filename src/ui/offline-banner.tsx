import { useEffect, useRef, useState } from "react"
import { AnimatePresence, m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"
import { ld } from "@/services/litedirecte"

function readBrowserOffline(): boolean {
  try {
    const nav = (globalThis as unknown as { navigator?: { onLine?: unknown } })
      .navigator
    return !!nav && nav.onLine === false
  } catch {
    return false
  }
}

export function OfflineBanner() {
  const [syncOffline, setSyncOffline] = useState(() => {
    try {
      return ld.sync.getState().state === "offline"
    } catch {
      return false
    }
  })
  const [browserOffline, setBrowserOffline] = useState(readBrowserOffline)
  // Transition de sortie : garde le bandeau monté 300 ms après le retour
  // en ligne pour un fondu, sans recharger la page.
  const [render, setRender] = useState(syncOffline || readBrowserOffline())
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    setSyncOffline(ld.sync.getState().state === "offline")
    setBrowserOffline(readBrowserOffline())
    const offSync = ld.sync.onChange((state) => {
      setSyncOffline(state.state === "offline")
    })
    const onOffline = () => setBrowserOffline(true)
    const onOnline = () => setBrowserOffline(false)
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      offSync()
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  const offline = syncOffline || browserOffline

  useEffect(() => {
    if (offline) {
      if (hideTimer.current !== null) clearTimeout(hideTimer.current)
      setRender(true)
      return
    }
    hideTimer.current = window.setTimeout(() => setRender(false), 300)
    return () => {
      if (hideTimer.current !== null) clearTimeout(hideTimer.current)
    }
  }, [offline])

  if (!render) return null

  return (
    <AnimatePresence initial={false}>
      {offline && (
        <m.div
          role="status"
          initial={{ height: 0, opacity: 0, y: -8 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.15, 1] }}
          className="flex min-h-0 items-center justify-center overflow-hidden px-4 py-0.5"
        >
          <p className="flex min-w-0 items-center justify-center gap-1 text-center text-[11px] leading-tight text-muted-foreground/60">
            <HugeiconsIcon
              icon={WifiDisconnected01Icon}
              strokeWidth={2}
              className="size-3 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">Hors ligne</span>
          </p>
        </m.div>
      )}
    </AnimatePresence>
  )
}
