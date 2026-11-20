import { useMemo, useState } from "react"
import { BookOpen01Icon } from "@hugeicons/core-free-icons"
import { NotebookObservationKind } from "@blockshub/pawnote-lts"
import { EmptyState } from "@/components/EmptyState"
import { InlineError } from "@/components/InlineError"
import { SchoolPage } from "@/components/SchoolPage"
import { StatCard } from "@/components/StatCard"
import { Spinner } from "@/components/ui/spinner"
import { useAsync } from "@/hooks/useAsync"
import { useLiveRefresh } from "@/hooks/useLiveRefresh"
import { fullDateLabel } from "@/lib/dates"
import { withPronote } from "@/services/litenote"

interface CarnetEntry {
  id: string
  title: string
  date: Date
  detail?: string
  context?: string
}

function CarnetSection({
  title,
  entries,
}: {
  title: string
  entries: CarnetEntry[]
}) {
  if (entries.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center justify-between gap-2 px-1 text-sm font-semibold">
        {title}
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {entries.length}
        </span>
      </h2>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/70 bg-card">
        {[...entries]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 px-4 py-3">
              <p className="text-sm font-medium text-card-foreground">
                {entry.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {[fullDateLabel(entry.date), entry.context]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {entry.detail && (
                <p className="text-sm break-words whitespace-pre-wrap text-card-foreground">
                  {entry.detail}
                </p>
              )}
            </li>
          ))}
      </ul>
    </section>
  )
}

async function readCarnet() {
  return withPronote((client) => client.attendance())
}

function sectionsFor(data: Awaited<ReturnType<typeof readCarnet>> | undefined) {
  const praise: CarnetEntry[] = []
  const issues: CarnetEntry[] = []
  const observations: CarnetEntry[] = []
  for (const entry of data?.observations ?? []) {
    const group =
      entry.kind === NotebookObservationKind.Encouragement
        ? praise
        : entry.kind === NotebookObservationKind.LogBookIssue
          ? issues
          : observations
    group.push({
      id: entry.id,
      title: entry.name || "Observation",
      date: entry.date,
      detail: entry.reason,
      context: entry.subject?.name,
    })
  }
  return [
    { key: "observations", title: "Observations", entries: observations },
    { key: "issues", title: "Défauts", entries: issues },
    { key: "praise", title: "Valorisations", entries: praise },
    {
      key: "punishments",
      title: "Punitions et sanctions",
      entries: (data?.punishments ?? []).map((entry) => ({
        id: entry.id,
        title: entry.title || "Punition",
        date: entry.dateGiven,
        context: entry.giver,
        detail: [entry.reasons.join(", "), entry.circumstances, entry.workToDo]
          .filter(Boolean)
          .join("\n"),
      })),
    },
    {
      key: "measures",
      title: "Mesures conservatoires",
      entries: (data?.precautionaryMeasures ?? []).map((entry) => ({
        id: entry.id,
        title: entry.title || "Mesure conservatoire",
        date: entry.dateGiven,
        context: entry.giver,
        detail: [entry.reasons.join(", "), entry.circumstances, entry.comments]
          .filter(Boolean)
          .join("\n"),
      })),
    },
  ]
}

export function Carnet() {
  const [reload, setReload] = useState(0)
  const refresh = useLiveRefresh("attendance")
  const { data, error, loading } = useAsync(readCarnet, [refresh, reload])
  const sections = useMemo(() => sectionsFor(data), [data])
  const empty = sections.every((section) => section.entries.length === 0)

  return (
    <SchoolPage title="Carnet">
      {loading ? (
        <div className="flex w-full items-center justify-center py-16">
          <Spinner aria-label="Chargement du carnet" />
        </div>
      ) : error ? (
        <InlineError
          message="Impossible de charger le carnet."
          onRetry={() => setReload((key) => key + 1)}
        />
      ) : (
        <div className="flex w-full flex-col gap-5 p-4 pb-6">
          <div aria-label="Résumé du carnet" className="grid grid-cols-3 gap-2">
            {sections.slice(0, 3).map((section) => (
              <StatCard
                key={section.key}
                label={section.title}
                value={section.entries.length}
              />
            ))}
          </div>
          {empty ? (
            <EmptyState
              icon={BookOpen01Icon}
              title="Carnet vide"
              description="Aucune entrée n’est publiée dans ton carnet."
            />
          ) : (
            sections.map((section) => (
              <CarnetSection
                key={section.key}
                title={section.title}
                entries={section.entries}
              />
            ))
          )}
        </div>
      )}
    </SchoolPage>
  )
}
