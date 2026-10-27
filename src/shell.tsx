import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import type { CSSProperties } from "react"
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { m } from "motion/react"
import {
  Home01Icon,
  Comment03Icon,
  Calendar02Icon,
  LibraryIcon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons"
import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationItemIcon,
  BottomNavigationItemLabel,
  BottomNavigationList,
} from "@/components/ui/shark/bottom-navigation"
import { Spinner } from "@/components/ui/spinner"
import { OfflineBanner } from "@/ui/offline-banner"
import { ReauthSheet } from "@/ui/reauth-sheet"
import { UpdateNotifier } from "@/ui/update-notifier"
import {
  refreshVisibleResources,
  useForegroundRefresh,
} from "@/hooks/use-foreground-refresh"
import { triggerHapticLight } from "@/services/haptics"
import { syncAppBadge } from "@/services/app-badge"
import { useMessagesBadge } from "@/pages/messages/hooks/useMessagesBadge"
import { HomePage } from "@/pages/home/HomePage"
import {
  isSectionId,
  settingsPath,
  type SectionId,
} from "@/pages/settings/sections"
import { cn } from "@/lib/utils"
import { AppToast } from "@/ui/app-toast"
import { subscribeQuestToast } from "@/services/quests"
import { toastText } from "@/services/quest-rules"

const loaders = {
  messages: () => import("@/pages/messages/Messages"),
  agenda: () => import("@/pages/agenda/Agenda"),
  homework: () => import("@/pages/homework/Homework"),
  grades: () => import("@/pages/grades/Grades"),
  absences: () => import("@/pages/absences/Absences"),
  postits: () => import("@/pages/postits/PostIts"),
  settings: () => import("@/pages/settings/SettingsDialog"),
  shop: () => import("@/pages/shop/ShopPage"),
}

const Messages = lazy(() =>
  loaders.messages().then((m) => ({ default: m.Messages }))
)
const Agenda = lazy(() => loaders.agenda().then((m) => ({ default: m.Agenda })))
const Homework = lazy(() =>
  loaders.homework().then((m) => ({ default: m.Homework }))
)
const Grades = lazy(() => loaders.grades().then((m) => ({ default: m.Grades })))
const Absences = lazy(() =>
  loaders.absences().then((m) => ({ default: m.Absences }))
)
const PostIts = lazy(() =>
  loaders.postits().then((m) => ({ default: m.PostIts }))
)
const SettingsDialog = lazy(() =>
  loaders.settings().then((m) => ({ default: m.SettingsDialog }))
)
const ShopPage = lazy(() =>
  loaders.shop().then((m) => ({ default: m.ShopPage }))
)

const TAB_ROUTES: Record<string, string> = {
  home: "/",
  messages: "/messages",
  agenda: "/agenda",
  homework: "/homework",
  grades: "/grades",
}

function tabForPath(pathname: string) {
  const match = Object.entries(TAB_ROUTES).find(([, path]) => path === pathname)
  return match?.[0] ?? "home"
}

function TabFallback() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <Spinner />
    </div>
  )
}

function TabBar({
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
  const hasUnread = unread !== null && unread > 0
  const retapProps = (value: string) =>
    value === active ? { onClick: onRetap } : {}
  const bounce = (value: string) =>
    active === value ? { initial: { scale: 0.7 }, animate: { scale: 1 } } : {}

  return (
    <BottomNavigationList>
      <BottomNavigationItem value="home" {...retapProps("home")}>
        <BottomNavigationItemIcon>
          <m.span
            key={`home-${active === "home"}`}
            {...bounce("home")}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex"
          >
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
          </m.span>
        </BottomNavigationItemIcon>
        <BottomNavigationItemLabel>Accueil</BottomNavigationItemLabel>
      </BottomNavigationItem>

      <BottomNavigationItem value="messages" {...retapProps("messages")}>
        <BottomNavigationItemIcon className="relative">
          <m.span
            key={`messages-${active === "messages"}`}
            {...bounce("messages")}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex"
          >
            <HugeiconsIcon icon={Comment03Icon} strokeWidth={2} />
          </m.span>
          {hasUnread && (
            <span
              aria-hidden="true"
              key={unread}
              className="absolute -top-1.5 -right-2 flex h-4 min-w-4 animate-[badge-pop_0.3s_ease-out] items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </BottomNavigationItemIcon>
        <BottomNavigationItemLabel>
          Messages
          {hasUnread && (
            <span className="sr-only">
              {` — ${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}`}
            </span>
          )}
        </BottomNavigationItemLabel>
      </BottomNavigationItem>

      <BottomNavigationItem value="agenda" {...retapProps("agenda")}>
        <BottomNavigationItemIcon>
          <m.span
            key={`agenda-${active === "agenda"}`}
            {...bounce("agenda")}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex"
          >
            <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
          </m.span>
        </BottomNavigationItemIcon>
        <BottomNavigationItemLabel>Agenda</BottomNavigationItemLabel>
      </BottomNavigationItem>

      <BottomNavigationItem value="homework" {...retapProps("homework")}>
        <BottomNavigationItemIcon>
          <m.span
            key={`homework-${active === "homework"}`}
            {...bounce("homework")}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex"
          >
            <HugeiconsIcon icon={LibraryIcon} strokeWidth={2} />
          </m.span>
        </BottomNavigationItemIcon>
        <BottomNavigationItemLabel>Devoirs</BottomNavigationItemLabel>
      </BottomNavigationItem>

      <BottomNavigationItem value="grades" {...retapProps("grades")}>
        <BottomNavigationItemIcon>
          <m.span
            key={`grades-${active === "grades"}`}
            {...bounce("grades")}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex"
          >
            <HugeiconsIcon icon={Mortarboard01Icon} strokeWidth={2} />
          </m.span>
        </BottomNavigationItemIcon>
        <BottomNavigationItemLabel>Notes</BottomNavigationItemLabel>
      </BottomNavigationItem>
    </BottomNavigationList>
  )
}

// One component for both routes: React reconciles `<HomePage />` across the
// navigation instead of remounting it, which would refetch every home widget.
function HomeRoute({ settings = false }: { settings?: boolean }) {
  const navigate = useNavigate()
  const { sectionId } = useParams()
  const redirects =
    sectionId === "general" ||
    (sectionId !== undefined && !isSectionId(sectionId))

  if (settings && redirects) return <Navigate to="/settings" replace />

  return (
    <>
      <HomePage />
      {settings && (
        <Suspense fallback={null}>
          <SettingsDialog
            open
            active={(sectionId ?? "general") as SectionId}
            onActiveChange={(section) => navigate(settingsPath(section))}
            onOpenChange={(open) => {
              if (!open) navigate("/")
            }}
          />
        </Suspense>
      )}
    </>
  )
}

export function MainFlow({ className, ...props }: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const unreadMessages = useMessagesBadge()
  const [navHidden, setNavHidden] = useState(false)
  const [questToast, setQuestToast] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollPositions = useRef(new Map<string, number>())
  const prevPath = useRef(pathname)

  useEffect(() => {
    return subscribeQuestToast((toast) => setQuestToast(toastText(toast)))
  }, [])

  // One scroll container is shared by all tabs: remember its position per
  // route, restore it when coming back, start at the top on first visit.
  useEffect(() => {
    const el = scrollRef.current
    const from = prevPath.current
    prevPath.current = pathname
    if (!el || from === pathname) return
    scrollPositions.current.set(from, el.scrollTop)
    el.scrollTop = scrollPositions.current.get(pathname) ?? 0
  }, [pathname])

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "h" || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }
    const target = event.target as HTMLElement | null
    const typing =
      target &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
        target.isContentEditable)
    if (typing) return
    setNavHidden((hidden) => !hidden)
  })

  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const load of Object.values(loaders)) void load()
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    syncAppBadge(unreadMessages)
  }, [unreadMessages])

  // Option A (sans nouveau geste) : l'app revient au premier plan via
  // `visibilitychange` (voir le hook). Le deuxième appui sur l'onglet actif
  // remonte en haut et rafraîchit doucement, avec le même seuil de 60 s.
  useForegroundRefresh()
  const handleRetap = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    refreshVisibleResources()
  }, [])

  return (
    <div
      className={cn("mx-auto flex w-full flex-col", className)}
      style={{ "--tabbar-height": "3.5rem" } as CSSProperties}
      {...props}
    >
      <BottomNavigation
        value={tabForPath(pathname)}
        onValueChange={(details) => {
          triggerHapticLight()
          navigate(TAB_ROUTES[details.value] ?? "/")
        }}
      >
        <OfflineBanner />
        <ReauthSheet />
        <UpdateNotifier />
        <AppToast
          message={questToast}
          tone="success"
          onClose={() => setQuestToast(null)}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))]"
        >
          <Suspense fallback={<TabFallback />}>
            <Routes>
              <Route index element={<HomeRoute />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="messages" element={<Messages />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="homework" element={<Homework />} />
              <Route path="grades" element={<Grades />} />
              <Route path="absences" element={<Absences />} />
              <Route path="post-its" element={<PostIts />} />
              <Route path="settings" element={<HomeRoute settings />} />
              <Route
                path="settings/:sectionId"
                element={<HomeRoute settings />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>

        <TabBar
          hidden={navHidden}
          unread={unreadMessages}
          active={tabForPath(pathname)}
          onRetap={handleRetap}
        />
      </BottomNavigation>
    </div>
  )
}
