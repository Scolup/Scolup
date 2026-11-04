import { Skeleton } from "@/components/ui/skeleton"

// Reprend la mise en page proportionnelle réelle (DaySchedule) : gouttière
// horaire de 56 px + carte dont la hauteur suit la durée du cours
// (`PX_PER_MIN = 76 / 55` dans DaySchedule/CourseCard). Le shimmer reste
// celui unique de `Skeleton`, sans délai ajouté.
const PX_PER_MIN = 76 / 55

const ROWS = [
  { minutes: 90, title: "w-3/4", meta: "w-1/2", pill: true },
  { minutes: 55, title: "w-2/3", meta: "w-2/5", pill: false },
  { minutes: 120, title: "w-3/5", meta: "w-1/3", pill: false },
  { minutes: 45, title: "w-1/2", meta: null as string | null, pill: false },
]

export function AgendaSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 px-4 pt-4 pb-10">
      <ol className="flex flex-col gap-1.5">
        {ROWS.map((row, i) => (
          <li key={i} className="flex w-full gap-2.5">
            <span className="flex w-14 shrink-0 flex-col items-center justify-center gap-1">
              <Skeleton className="h-3.5 w-10 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </span>
            <div
              className="flex min-w-0 flex-1 gap-3 rounded-2xl border border-border/70 bg-card p-3.5"
              style={{ minHeight: Math.round(row.minutes * PX_PER_MIN) }}
            >
              <Skeleton className="w-1.5 shrink-0 self-stretch rounded-full" />
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <Skeleton className={`h-4 rounded-full ${row.title}`} />
                {row.meta && (
                  <Skeleton className={`h-3 rounded-full ${row.meta}`} />
                )}
                {row.pill && <Skeleton className="h-5 w-16 rounded-full" />}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
