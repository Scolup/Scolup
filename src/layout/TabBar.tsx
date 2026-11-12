import { HugeiconsIcon } from "@hugeicons/react"
import { m } from "motion/react"
import {
  BottomNavigationItem,
  BottomNavigationItemIcon,
  BottomNavigationItemLabel,
  BottomNavigationList,
} from "@/components/ui/shark/bottom-navigation"
import { TABS } from "./tabs"

const ICON_SPRING = { type: "spring", stiffness: 500, damping: 18 } as const

function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1.5 -right-2 flex h-4 min-w-4 animate-[badge-pop_0.3s_ease-out] items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground"
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}

function unreadLabel(count: number): string {
  const plural = count > 1 ? "s" : ""
  return ` — ${count} message${plural} non lu${plural}`
}

export function TabBar({
  hidden,
  unread,
  active,
  onRetap,
}: {
  hidden: boolean
  unread: number | null
  active: string
  onRetap: () => void
}) {
  if (hidden) return null

  return (
    <BottomNavigationList>
      {TABS.map((tab) => {
        const isActive = tab.value === active
        // Seul l'onglet Messages affiche un badge de messages non lus.
        const isMessages = tab.value === "messages"
        const count = isMessages && unread ? unread : 0

        return (
          <BottomNavigationItem
            key={tab.value}
            value={tab.value}
            {...(isActive ? { onClick: onRetap } : {})}
          >
            <BottomNavigationItemIcon
              className={isMessages ? "relative" : undefined}
            >
              <m.span
                key={`${tab.value}-${isActive}`}
                {...(isActive
                  ? { initial: { scale: 0.7 }, animate: { scale: 1 } }
                  : {})}
                transition={ICON_SPRING}
                className="flex"
              >
                <HugeiconsIcon icon={tab.icon} strokeWidth={2} />
              </m.span>
              {count > 0 && <UnreadBadge key={count} count={count} />}
            </BottomNavigationItemIcon>
            <BottomNavigationItemLabel>
              {tab.label}
              {count > 0 && (
                <span className="sr-only">{unreadLabel(count)}</span>
              )}
            </BottomNavigationItemLabel>
          </BottomNavigationItem>
        )
      })}
    </BottomNavigationList>
  )
}
