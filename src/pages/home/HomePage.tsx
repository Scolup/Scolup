import {
  BookOpen01Icon,
  Chair02Icon,
  Restaurant01Icon,
  StickyNote02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useHomePage } from "./hooks/useHomePage"
import { AccountMenu } from "./components/AccountMenu"
import { GradesWidget } from "./components/GradesWidget"
import { HomeworkWidget } from "./components/HomeworkWidget"
import { MessagesWidget } from "./components/MessagesWidget"
import { NextCoursesWidget } from "./components/NextCoursesWidget"
import { NextQuestsCard } from "./components/NextQuestsCard"
import { AppToast } from "@/components/AppToast"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useSplashTask } from "@/services/splash"
import { useRubies } from "@/features/shop/useRubies"
import { useNavigate } from "react-router"
import { triggerHapticLight } from "@/services/haptics"
import { useEffect } from "react"
import { track } from "@/features/quests/service"
import { toDayKey } from "@/lib/dates"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { isPronote } from "@/services/litenote"
import { DecoMotif } from "@/components/DecoOrnament"
import { cn } from "@/lib/utils"

const ABSENCES_LINK = {
  icon: Chair02Icon,
  label: "Absences",
  path: "/absences",
}
const SCHOOL_LINKS = [
  ABSENCES_LINK,
  { icon: StickyNote02Icon, label: "Post-its", path: "/post-its" },
] as const
const PRONOTE_SCHOOL_LINKS = [
  ABSENCES_LINK,
  { icon: BookOpen01Icon, label: "Carnet", path: "/carnet" },
  { icon: Restaurant01Icon, label: "Menu de la semaine", path: "/menus" },
] as const

export function HomePage() {
  const page = useHomePage()
  const rubies = useRubies()
  const navigate = useNavigate()
  const pronote = isPronote()

  useEffect(() => {
    // The day is the key: "Assidu" counts different days, not openings.
    void track("app-open", toDayKey(new Date()))
  }, [])

  useSplashTask(page.loading)

  const isMedium = useMediaQuery("(min-width: 640px)")
  const isWide = useMediaQuery("(min-width: 1280px)")
  const columnCount = isWide ? 3 : isMedium ? 2 : 1
  const widgets = [
    <HomeworkWidget key="homework" />,
    <NextCoursesWidget key="courses" />,
    <GradesWidget key="grades" />,
    <MessagesWidget key="messages" />,
  ]
  const widgetColumns = Array.from({ length: columnCount }, (_, column) =>
    widgets.filter((_, index) => index % columnCount === column)
  )

  return (
    <div className="relative isolate flex flex-col gap-4 px-4 pt-4 pb-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] overflow-hidden bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"
      >
        <DecoMotif />
      </div>

      <AppToast message={page.actionError} onClose={page.dismissActionError} />

      <div className="relative flex items-center justify-between">
        <AccountMenu
          displayName={page.displayName}
          initials={page.initials}
          loggingOut={page.loggingOut}
          confirmOpen={page.confirmOpen}
          aboutOpen={page.aboutOpen}
          onSettings={page.openSettings}
          onAskLogout={page.askLogout}
          onAskAbout={page.askAbout}
          onLogout={page.logout}
          onConfirmOpenChange={page.setConfirmOpen}
          onAboutOpenChange={page.setAboutOpen}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHapticLight()
              navigate("/rubis")
            }}
            aria-label={`Rubis : ${rubies} — boutique et quêtes`}
            className="flex h-11 press items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <img src="/ruby.svg" alt="" aria-hidden="true" className="size-5" />
            <span className="text-sm font-medium text-card-foreground">
              <AnimatedNumber value={String(rubies)} />
            </span>
          </button>
        </div>
      </div>

      <NextQuestsCard />

      <nav
        aria-label="Vie scolaire"
        className={cn("gap-2", pronote ? "grid grid-cols-3" : "flex")}
      >
        {(pronote ? PRONOTE_SCHOOL_LINKS : SCHOOL_LINKS).map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => page.openPage(link.path)}
            className={cn(
              "flex min-h-14 min-w-0 flex-1 press items-center gap-3 rounded-full border border-border/70 bg-card px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50",
              pronote &&
                "max-sm:flex-col max-sm:justify-center max-sm:gap-2 max-sm:rounded-3xl max-sm:px-2 max-sm:text-center"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
              <HugeiconsIcon
                icon={link.icon}
                strokeWidth={1.5}
                className="size-5"
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                "min-w-0 text-sm font-medium text-card-foreground",
                pronote ? "max-sm:text-xs" : "flex-1 truncate"
              )}
            >
              {link.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Colonnes explicites (répartition à tour de rôle) plutôt que CSS
          `columns` : quand un widget passe du squelette au contenu, les autres
          ne sont plus rééquilibrés ni déplacés. */}
      <div className="flex items-start gap-4">
        {widgetColumns.map((column, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
            {column}
          </div>
        ))}
      </div>
    </div>
  )
}
