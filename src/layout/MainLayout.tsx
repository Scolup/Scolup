import { Activity, Suspense, useCallback, useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router"
import { BottomNavigation } from "@/components/ui/shark/bottom-navigation"
import { Spinner } from "@/components/ui/spinner"
import { AppToast } from "@/components/AppToast"
import { RewardBurst } from "@/components/RewardBurst"
import { OfflineBanner } from "@/components/OfflineBanner"
import { ReauthSheet } from "@/components/ReauthSheet"
import {
  refreshVisibleResources,
  useForegroundRefresh,
} from "@/hooks/useForegroundRefresh"
import {
  beginStartupSync,
  getSyncStatus,
  onSyncStatus,
  startCloudSync,
  useSyncStatus,
} from "@/services/cloudSync"
import { useSplashTask } from "@/services/splash"
import { subscribeQuestToast } from "@/features/quests/service"
import { toastText } from "@/features/quests/toast"
import { subscribeCelebrate } from "@/lib/celebrate"
import { cn } from "@/lib/utils"
import { useMessagesBadge } from "@/pages/messages/hooks/useMessagesBadge"
import { syncAppBadge } from "@/services/appBadge"
import { triggerHapticLight } from "@/services/haptics"
import { HomeRoute } from "./HomeRoute"
import {
  Absences,
  Agenda,
  Grades,
  Homework,
  Learn,
  Messages,
  pageLoaders,
  PostIts,
  RubiesPage,
} from "./lazyPages"
import { pathForTab, tabForPath, TABS } from "./tabs"
import { TabBar } from "./TabBar"
import { useScrollMemory } from "./useScrollMemory"
import { useTabBarShortcut } from "./useTabBarShortcut"

// Les onglets, dans l'ordre de la barre. « /settings » et « / » sont tous les
// deux l'accueil. Chaque onglet visité reste monté dans une <Activity> : on
// retrouve l'écran tel qu'on l'a laissé (état, données, défilement), sans
// rechargement, et ses effets (rafraîchissements) sont suspendus tant qu'il
// est masqué.
const TAB_KEYS = TABS.map(({ path }) => path.slice(1))
const PAGE_SHIFT_PX = 12

const SETTINGS_PATH = /^\/settings(?:\/([^/]+))?\/?$/

// Écran affiché pour un chemin : l'accueil pour « / » et les réglages, sinon
// le premier segment (un onglet, ou un écran secondaire).
function pageKeyForPath(pathname: string): string {
  if (pathname === "/" || SETTINGS_PATH.test(pathname)) return ""
  return pathname.split("/")[1] ?? ""
}

function isTabKey(key: string): boolean {
  return TAB_KEYS.includes(key)
}

// Ordre d'affichage pour le sens de l'animation ; les écrans secondaires
// (plein écran, avec leur propre entrée) viennent après les onglets.
function pageOrder(key: string): number {
  const index = TAB_KEYS.indexOf(key)
  return index === -1 ? TAB_KEYS.length : index
}

function TabFallback() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <Spinner />
    </div>
  )
}

export function MainLayout({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const unreadMessages = useMessagesBadge()
  const tabBarHidden = useTabBarShortcut()
  const scrollRef = useScrollMemory(
    pathname === "/learn"
      ? `/learn:${new URLSearchParams(search).get("vue") ?? "accueil"}`
      : pathname
  )
  // Entrée de page : on arrive de la droite en avançant, de la gauche en
  // reculant. Rien ne joue au tout premier affichage (le splash couvre).
  const pageKey = pageKeyForPath(pathname)
  const [page, setPage] = useState({
    key: pageKey,
    order: pageOrder(pageKey),
    shift: 0,
    animate: false,
    visited: isTabKey(pageKey) ? [pageKey] : [],
  })
  if (page.key !== pageKey) {
    const order = pageOrder(pageKey)
    setPage({
      key: pageKey,
      order,
      shift: order > page.order ? PAGE_SHIFT_PX : -PAGE_SHIFT_PX,
      animate: isTabKey(pageKey),
      visited:
        isTabKey(pageKey) && !page.visited.includes(pageKey)
          ? [...page.visited, pageKey]
          : page.visited,
    })
  }
  const settingsMatch = SETTINGS_PATH.exec(pathname)
  const visitedKeys = new Set(page.visited)
  const tabElements: Record<string, React.ReactNode> = {
    "": (
      <HomeRoute
        settings={settingsMatch !== null}
        sectionId={settingsMatch?.[1]}
      />
    ),
    messages: <Messages />,
    agenda: <Agenda />,
    homework: <Homework />,
    grades: <Grades />,
    learn: <Learn />,
  }
  const [questToast, setQuestToast] = useState<string | null>(null)
  // Each quest reward bumps this tick: the active deco theme celebrates it.
  const [rewardTick, setRewardTick] = useState(0)
  const syncStatus = useSyncStatus()
  const [syncReady, setSyncReady] = useState(
    () => syncStatus.startup === "done" && !syncStatus.offline
  )
  useSplashTask(!syncReady)

  useEffect(() => {
    return subscribeQuestToast((toast) => {
      setQuestToast(toastText(toast))
      setRewardTick((tick) => tick + 1)
    })
  }, [])

  useEffect(
    () => subscribeCelebrate(() => setRewardTick((tick) => tick + 1)),
    []
  )

  // On précharge tous les écrans une seconde après le démarrage.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const load of Object.values(pageLoaders)) void load()
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [])

  // Synchronisation des réglages, rubis et quêtes entre appareils. Le splash
  // reste affiché jusqu'au premier passage, sauf si l'appareil est hors ligne
  // (auquel cas l'état local n'est pas fusionné : on affiche l'état vide).
  useEffect(() => {
    beginStartupSync()
    const offStatus = onSyncStatus(() => {
      const s = getSyncStatus()
      setSyncReady(s.startup === "done" && !s.offline)
    })
    const stopSync = startCloudSync()
    return () => {
      offStatus()
      stopSync()
    }
  }, [])

  useEffect(() => {
    syncAppBadge(unreadMessages)
  }, [unreadMessages])

  // Au retour au premier plan, useForegroundRefresh rafraîchit les données.
  // Un second appui sur l'onglet actif remonte en haut de page et rafraîchit
  // aussi, avec le même seuil de 60 s.
  useForegroundRefresh()
  const handleRetap = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    refreshVisibleResources()
  }, [scrollRef])

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
          navigate(pathForTab(details.value))
        }}
      >
        <OfflineBanner />
        <ReauthSheet />
        <RewardBurst tick={rewardTick} />
        <AppToast
          message={questToast}
          tone="success"
          onClose={() => setQuestToast(null)}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))]"
        >
          {TAB_KEYS.filter((key) => visitedKeys.has(key)).map((key) => (
            <Activity key={key} mode={key === page.key ? "visible" : "hidden"}>
              {/* Réaffiché, l'onglet rejoue son entrée : l'animation CSS
                  redémarre quand le wrapper repasse de display: none à
                  affiché. */}
              <div
                className={page.animate ? "page-enter" : "contents"}
                style={{ "--page-dx": `${page.shift}px` } as CSSProperties}
              >
                <Suspense fallback={<TabFallback />}>
                  {tabElements[key]}
                </Suspense>
              </div>
            </Activity>
          ))}
          {!isTabKey(page.key) && (
            <Suspense fallback={<TabFallback />}>
              <Routes>
                <Route
                  path="shop"
                  element={<Navigate to="/rubis?tab=boutique" replace />}
                />
                <Route path="rubis" element={<RubiesPage />} />
                <Route path="absences" element={<Absences />} />
                <Route path="post-its" element={<PostIts />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          )}
        </div>

        <TabBar
          hidden={tabBarHidden}
          unread={unreadMessages}
          active={tabForPath(pathname)}
          onRetap={handleRetap}
        />
      </BottomNavigation>
    </div>
  )
}
