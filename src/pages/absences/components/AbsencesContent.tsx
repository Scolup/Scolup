import {
  AlertCircleIcon,
  Award02Icon,
  Chair02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { FadeIn } from "@/ui/fade-in"
import type { AttendanceStats, MiscEvent } from "../helpers"
import { AbsencesStats } from "./AbsencesStats"
import { AttendanceRow } from "./AttendanceRow"
import { EventSection } from "./EventSection"
import { MiscRow } from "./MiscRow"
import { Notice } from "./Notice"

export function AbsencesContent({
  eventCount,
  sanctions,
  dispenses,
  stats,
}: {
  eventCount: number
  sanctions: MiscEvent[]
  dispenses: MiscEvent[]
  stats: AttendanceStats
}) {
  const unjustified = stats.unjustified

  return (
    <FadeIn className="flex flex-col gap-6 px-4 py-4 pb-6">
      {unjustified > 0 ? (
        <Notice
          tone="warning"
          icon={AlertCircleIcon}
          title={`${unjustified} événement${unjustified > 1 ? "s" : ""} non justifié${unjustified > 1 ? "s" : ""}`}
          body="Pense à les justifier auprès de ta vie scolaire."
        />
      ) : (
        eventCount > 0 && (
          <Notice
            tone="success"
            icon={CheckmarkCircle02Icon}
            title="Tout est en règle"
            body="Aucune absence ni aucun retard injustifié."
          />
        )
      )}

      {eventCount > 0 && <AbsencesStats stats={stats} />}

      {stats.absences.length > 0 && (
        <EventSection
          title="Absences"
          icon={Chair02Icon}
          events={stats.absences}
          renderRow={(event, last) => (
            <AttendanceRow event={event} last={last} />
          )}
        />
      )}

      {stats.retards.length > 0 && (
        <EventSection
          title="Retards"
          icon={Clock01Icon}
          events={stats.retards}
          renderRow={(event, last) => (
            <AttendanceRow event={event} last={last} />
          )}
        />
      )}

      {sanctions.length > 0 && (
        <EventSection
          title="Sanctions et encouragements"
          icon={Award02Icon}
          events={sanctions}
          renderRow={(event, last) => <MiscRow event={event} last={last} />}
        />
      )}

      {dispenses.length > 0 && (
        <EventSection
          title="Dispenses"
          icon={CheckmarkCircle02Icon}
          events={dispenses}
          renderRow={(event, last) => <MiscRow event={event} last={last} />}
        />
      )}
    </FadeIn>
  )
}
