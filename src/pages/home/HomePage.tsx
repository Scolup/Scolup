import { Chair02Icon, StickyNote02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useHomePage } from "./hooks/useHomePage"
import { AccountMenu } from "./components/AccountMenu"
import { GradesWidget } from "./components/GradesWidget"
import { HomeworkWidget } from "./components/HomeworkWidget"
import { MessagesWidget } from "./components/MessagesWidget"
import { NextCoursesWidget } from "./components/NextCoursesWidget"
import { AppToast } from "@/ui/app-toast"
import { useSplashTask } from "@/services/splash"

const SCHOOL_LINKS = [
  { icon: Chair02Icon, label: "Absences", path: "/absences" },
  { icon: StickyNote02Icon, label: "Post-its", path: "/post-its" },
] as const

export function HomePage() {
  const page = useHomePage()

  useSplashTask(page.loading)

  return (
    <div className="relative isolate flex flex-col gap-4 px-4 pt-4 pb-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-112 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"
      />

      <AppToast message={page.actionError} onClose={page.dismissActionError} />

      <AccountMenu
        photo={page.photo}
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

      <nav aria-label="Vie scolaire" className="flex gap-2">
        {SCHOOL_LINKS.map((link) => (
          <button
            key={link.path}
            type="button"
            onClick={() => page.openPage(link.path)}
            className="flex min-h-14 flex-1 items-center gap-3 rounded-full border border-border/70 bg-card px-4 py-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
              <HugeiconsIcon
                icon={link.icon}
                strokeWidth={1.5}
                className="size-5"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
              {link.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:min-w-0 [&>*]:break-inside-avoid">
        <HomeworkWidget />
        <NextCoursesWidget />
        <GradesWidget />
        <MessagesWidget />
      </div>
    </div>
  )
}
