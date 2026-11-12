import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { Subject } from "../curriculum"
import type { useLearnPage } from "../hooks/useLearnPage"
import { SUBJECT_STYLE } from "../subjectStyle"

type Recommendations = ReturnType<typeof useLearnPage>["ranked"]

export function LearnRecommendations({
  page,
  practice,
}: {
  page: ReturnType<typeof useLearnPage>
  practice: boolean
}) {
  const priority = page.ranked
    .filter(({ reasons }) => reasons.some((kind) => kind !== "grade"))
    .slice(0, 2)
  const groups = new Map<Subject, Recommendations>()
  const highlighted = new Set(priority.map(({ lesson }) => lesson.id))
  for (const entry of page.ranked) {
    if (highlighted.has(entry.lesson.id)) continue
    const subject = entry.lesson.subject
    const group = groups.get(subject)
    if (group) group.push(entry)
    else groups.set(subject, [entry])
  }

  function card(
    { lesson, reference }: Recommendations[number],
    highlighted = false
  ) {
    const { icon, tint } = SUBJECT_STYLE[lesson.subject]
    return (
      <button
        key={lesson.id}
        type="button"
        onClick={() =>
          page.select(
            practice
              ? { kind: "exercise", lesson }
              : { kind: "review", lesson, reference }
          )
        }
        className={cn(
          "flex min-h-28 press-lg flex-col justify-between gap-2.5 rounded-2xl border border-border/70 bg-card p-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
          highlighted && "rounded-3xl border-primary/15 bg-primary/5 p-3.5"
        )}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              tint
            )}
          >
            <HugeiconsIcon icon={icon} className="size-4" aria-hidden="true" />
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <span>
          <span className="block font-heading text-sm leading-snug font-semibold">
            {lesson.title}
          </span>
          {highlighted && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {lesson.subject}
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {priority.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-0.5 font-heading text-lg font-semibold">
            À travailler en ce moment
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {priority.map((entry) => card(entry, true))}
          </div>
        </section>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {[...groups].map(([subject, entries]) => {
          const { icon, tint } = SUBJECT_STYLE[subject]
          return (
            <section
              key={subject}
              className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-muted/25 p-3"
            >
              <header className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    tint
                  )}
                >
                  <HugeiconsIcon
                    icon={icon}
                    className="size-4"
                    aria-hidden="true"
                  />
                </span>
                <h2 className="font-heading font-semibold">{subject}</h2>
              </header>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
                {entries.map((entry) => card(entry))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
