import { Chair02Icon, StickyNote02Icon } from "@hugeicons/core-free-icons"
import { Separator } from "@/components/ui/separator"
import { useHomePage } from "./hooks/useHomePage"
import { AccountMenu } from "./components/AccountMenu"
import { GradesWidget } from "./components/GradesWidget"
import { HomeworkWidget } from "./components/HomeworkWidget"
import { MessagesWidget } from "./components/MessagesWidget"
import { NextCoursesWidget } from "./components/NextCoursesWidget"
import { QuickButton } from "./components/QuickButton"
import { AppToast } from "@/ui/app-toast"
import { useSplashTask } from "@/services/splash"

export function HomePage() {
  const page = useHomePage()

  useSplashTask(page.loading)

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
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

      <div className="flex gap-2">
        <QuickButton
          icon={Chair02Icon}
          label="Absences"
          onClick={() => page.openPage("/absences")}
        />
        <QuickButton
          icon={StickyNote02Icon}
          label="Post-its"
          onClick={() => page.openPage("/post-its")}
        />
      </div>

      <div className="px-8">
        <Separator className="my-2" />
      </div>

      <div className="columns-1 gap-3 md:columns-2 lg:columns-3 [&>*]:mb-3 [&>*]:min-w-0 [&>*]:break-inside-avoid">
        <HomeworkWidget />
        <NextCoursesWidget />
        <GradesWidget />
        <MessagesWidget />
      </div>
    </div>
  )
}
