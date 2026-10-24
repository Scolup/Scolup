import { useCallback, useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { NoteIcon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { EmptyState } from "@/ui/empty-state"
import { triggerHapticLight } from "@/services/haptics"
import { applyUpdate, prepareUpdate } from "@/services/service-worker"
import { Spinner } from "@/components/ui/spinner"
import {
  checkForUpdate,
  parseReleaseNotes,
  type InlineToken,
  type LatestRelease,
} from "@/services/update"

const CHECK_DELAY_MS = 2_000

function HeaderIcon() {
  return (
    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5" />
    </div>
  )
}

function Inline({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((token, index) => {
    if (token.type === "bold") {
      return (
        <strong key={index} className="font-semibold">
          {token.text}
        </strong>
      )
    }
    if (token.type === "code") {
      return (
        <code
          key={index}
          className="rounded bg-background px-1 py-0.5 font-mono text-xs"
        >
          {token.text}
        </code>
      )
    }
    if (token.type === "link") {
      return (
        <a
          key={index}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4"
        >
          {token.text}
        </a>
      )
    }
    return token.text
  })
}

function ReleaseNotes({ body }: { body: string }) {
  const blocks = parseReleaseNotes(body)
  if (blocks.length === 0) {
    return (
      <EmptyState
        className="p-6"
        icon={NoteIcon}
        title="Aucune note de version"
        description="Cette version n'a aucun détail à afficher."
      />
    )
  }

  return (
    <div className="max-h-60 overflow-y-auto rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed break-words">
      <div className="flex flex-col gap-1.5">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <p key={index} className="font-heading font-semibold">
                <Inline tokens={block.tokens} />
              </p>
            )
          }
          if (block.type === "bullet") {
            return (
              <p key={index} className="flex gap-2">
                <span aria-hidden="true" className="text-muted-foreground">
                  •
                </span>
                <span>
                  <Inline tokens={block.tokens} />
                </span>
              </p>
            )
          }
          return (
            <p key={index}>
              <Inline tokens={block.tokens} />
            </p>
          )
        })}
      </div>
    </div>
  )
}

function UpdateButton({
  updating,
  onClick,
  className,
}: {
  updating: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <Button onClick={onClick} disabled={updating} className={className}>
      {updating ? (
        <>
          <Spinner className="size-4 border-current border-t-transparent" />
          Mise à jour…
        </>
      ) : (
        "Mettre à jour"
      )}
    </Button>
  )
}

export function UpdateNotifier() {
  const [release, setRelease] = useState<LatestRelease | null>(null)
  const [updating, setUpdating] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 640px)")

  const runCheck = useCallback(async () => {
    try {
      const latest = await checkForUpdate()
      if (!latest) return
      setRelease(latest)
      // Le nouveau worker est téléchargé en arrière-plan : le bouton
      // « Mettre à jour » n'aura plus qu'à lui donner le relais.
      void prepareUpdate()
    } catch {
      // The notifier is best-effort: a failed check simply shows nothing.
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void runCheck(), CHECK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [runCheck])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void runCheck()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [runCheck])

  if (!release) return null

  async function update() {
    if (updating) return
    triggerHapticLight()
    setUpdating(true)
    try {
      await applyUpdate()
    } catch {
      window.location.reload()
    }
  }

  const description = `La version ${release.tag} est disponible. Recharge l'application pour en profiter.`

  if (isDesktop) {
    return (
      <Dialog
        open
        onOpenChange={(_, details) => details.cancel()}
        disablePointerDismissal
      >
        <DialogContent className="gap-5" showCloseButton={false}>
          <DialogHeader className="items-center gap-3 text-center">
            <HeaderIcon />
            <div className="flex flex-col gap-1">
              <DialogTitle>Nouvelle version disponible</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </DialogHeader>

          <ReleaseNotes body={release.body} />

          <DialogFooter>
            <UpdateButton updating={updating} onClick={update} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open dismissible={false}>
      <DrawerContent>
        <div className="flex flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center gap-3 text-center">
            <HeaderIcon />
            <div className="flex flex-col gap-1">
              <DrawerTitle>Nouvelle version disponible</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </div>
          </div>

          <ReleaseNotes body={release.body} />

          <UpdateButton
            updating={updating}
            onClick={update}
            className="min-h-11 w-full"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
