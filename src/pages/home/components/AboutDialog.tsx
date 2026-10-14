import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  Building03Icon,
  Copy01Icon,
  CopyCheckIcon,
  File01Icon,
  Mail01Icon,
  SecurityLockIcon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { OpenSourceRepos } from "@/pages/legal/components/OpenSourceRepos"
import { cn } from "@/lib/utils"
import { proseClassName } from "@/ui/prose"

const LINKS = [
  {
    label: "Conditions d'utilisation",
    href: "/terms",
    icon: File01Icon,
    external: true,
  },
  {
    label: "Politique de confidentialité",
    href: "/privacy",
    icon: ShieldCheckIcon,
    external: true,
  },
  {
    label: "Sécurité",
    href: "/security",
    icon: SecurityLockIcon,
    external: true,
  },
  {
    label: "Mentions légales",
    href: "/mentions",
    icon: Building03Icon,
    external: true,
  },
  {
    label: "Contact : hi@scolup.com",
    href: "mailto:hi@scolup.com",
    icon: Mail01Icon,
    external: false,
  },
] as const

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const versionInfo = `version ${__APP_VERSION__}`

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  async function copyVersionInfo() {
    try {
      await navigator.clipboard.writeText(versionInfo)
    } catch {
      return // clipboard blocked, nothing to confirm
    }
    setCopied(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5">
        <DialogHeader>
          <DialogTitle>À propos</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3.5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <img
              src="/logos/logo.svg"
              alt="Scolup"
              className="size-8 dark:invert"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-heading text-lg leading-none font-semibold tracking-tight">
              Scolup
            </p>
            <p className="text-xs text-muted-foreground">{versionInfo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copyVersionInfo}
            title="Copier la version"
            aria-label={copied ? "Version copiée" : "Copier la version"}
            className="-my-2 size-11 shrink-0 text-muted-foreground"
          >
            <HugeiconsIcon
              icon={copied ? CopyCheckIcon : Copy01Icon}
              strokeWidth={1.5}
            />
          </Button>
        </div>

        <ItemGroup>
          {LINKS.map((link) => (
            <Item
              key={link.href}
              variant="outline"
              size="sm"
              render={
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                />
              }
            >
              <ItemMedia variant="icon">
                <HugeiconsIcon
                  icon={link.icon}
                  strokeWidth={1.5}
                  className="size-5 text-muted-foreground"
                />
              </ItemMedia>
              <ItemContent>
                {/* Two lines: "Politique de confidentialité" truncates on narrow phones. */}
                <ItemTitle className="line-clamp-2">{link.label}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  strokeWidth={1.5}
                  className="size-4 text-muted-foreground"
                />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>

        <div
          className={cn(
            proseClassName,
            "rounded-2xl bg-muted/50 p-4 text-xs [&_p]:mb-2 [&_ul]:mb-0"
          )}
        >
          <p>Logiciel libre sous licence AGPL-3.0 :</p>
          <OpenSourceRepos />
        </div>
      </DialogContent>
    </Dialog>
  )
}
