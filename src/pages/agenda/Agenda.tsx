import { m } from "motion/react"
import type { ReactNode } from "react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { EASE_OUT } from "@/hooks/use-micro-interactions"
import { toDayKey } from "@/services/dates"
import { dayLabel } from "./helpers"
import { useAgendaPage } from "./hooks/useAgendaPage"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { AgendaHeader } from "./components/AgendaHeader"
import { AgendaSkeleton } from "./components/AgendaSkeleton"
import { CourseDrawer } from "./components/CourseDrawer"
import { DayView } from "./components/DayView"
import { WeekView } from "./components/WeekView"
import { EmptyState } from "@/ui/empty-state"
import { InlineError } from "@/ui/inline-error"
import { Button } from "@/components/ui/button"
;("use client")

export function Agenda() {
  const page = useAgendaPage()
  const showSkeleton = useDelayedLoading(page.loading)

  let content: ReactNode = null
  if (page.loading) {
    if (showSkeleton) content = <AgendaSkeleton />
  } else if (page.error) {
    content = (
      <InlineError
        title="Emploi du temps indisponible"
        message={page.error}
        onRetry={page.refresh}
      />
    )
  } else if (page.visible.length === 0) {
    content = (
      <EmptyState
        icon={Calendar03Icon}
        title={"Aucun cours"}
        description={
          page.view === "week"
            ? "Rien n'est prévu cette semaine."
            : `Rien n'est prévu ${dayLabel(page.date).toLowerCase()}.`
        }
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={page.refresh}
            className="min-h-11"
          >
            Actualiser
          </Button>
        }
      />
    )
  } else if (page.view === "week") {
    content = (
      <WeekView
        date={page.date}
        courses={page.weekCourses}
        onSelect={page.select}
      />
    )
  } else {
    content = (
      <m.div
        key={toDayKey(page.date)}
        initial={{ opacity: 0, x: page.navDir * 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
      >
        <DayView
          date={page.date}
          courses={page.dayCourses}
          onSelect={page.select}
        />
      </m.div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-0">
      <AgendaHeader
        date={page.date}
        view={page.view}
        onDateChange={page.setDate}
        onViewChange={page.setView}
      />

      {/* Le swipe vit sur le conteneur toujours rendu — pas sur le contenu
      du jour — sinon les jours vides (week-ends) ne swipent pas, faute de
      handlers. Bonus : la vue semaine swippe semaine par semaine. */}
      <div className="min-h-[50dvh]" {...page.swipe}>
        {content}
      </div>

      <CourseDrawer course={page.selected} onClose={() => page.select(null)} />
    </div>
  )
}
