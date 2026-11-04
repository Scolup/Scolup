import { Suspense, useCallback, useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router"
import { BottomNavigation } from "@/components/ui/shark/bottom-navigation"
import { Spinner } from "@/components/ui/spinner"
import { AppToast } from "@/components/AppToast"
import { OfflineBanner } from "@/components/OfflineBanner"
import { ReauthSheet } from "@/components/ReauthSheet"
import { UpdateNotifier } from "@/components/UpdateNotifier"
import {
  refreshVisibleResources,
  useForegroundRefresh,
} from "@/hooks/useForegroundRefresh"
import { subscribeQuestToast } from "@/features/quests/service"
import { toastText } from "@/features/quests/toast"
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
  Messages,
  pageLoaders,
  PostIts,
  RubiesPage,
} from "./lazyPages"
import { pathForTab, TabBar, tabForPath } from "./TabBar"
import { useScrollMemory } from "./useScrollMemory"
import { useTabBarShortcut } from "./useTabBarShortcut"

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
  const { pathname } = useLocation()
  const unreadMessages = useMessagesBadge()
  const tabBarHidden = useTabBarShortcut()
  const scrollRef = useScrollMemory(pathname)
  const [questToast, setQuestToast] = useState<string | null>(null)

  useEffect(() => {
    return subscribeQuestToast((toast) => setQuestToast(toastText(toast)))
  }, [])

  // On précharge tous les écrans une seconde après le démarrage.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const load of Object.values(pageLoaders)) void load()
    }, 1000)
    return () => window.clearTimeout(timer)
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
              <Route
                path="shop"
                element={<Navigate to="/rubis?tab=boutique" replace />}
              />
              <Route path="rubis" element={<RubiesPage />} />
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
          hidden={tabBarHidden}
          unread={unreadMessages}
          active={tabForPath(pathname)}
          onRetap={handleRetap}
        />
      </BottomNavigation>
    </div>
  )
}
