import { useState } from "react"
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { programmeSource, type Lesson, type Level } from "../curriculum"
import { buildExercises } from "../exercises"
import type { SchoolSignal } from "../ranking"
import { LearnScreen } from "./LearnScreen"

export function RevisionScreen({
  lesson,
  level,
  reference,
  onClose,
  onFinish,
}: {
  lesson: Lesson
  level: Level
  reference?: Pick<SchoolSignal, "kind" | "text">
  onClose: () => void
  onFinish: (takeQuiz: boolean) => Promise<void>
}) {
  const source = programmeSource(level, lesson.subject, new Date())
  const application =
    lesson.subject === "Mathématiques"
      ? buildExercises(lesson, 4)[3]
      : undefined
  const [status, setStatus] = useState<"ready" | "saving" | "error">("ready")
  const saving = status === "saving"

  function close() {
    if (!saving) onClose()
  }

  async function finish(takeQuiz: boolean) {
    if (saving) return
    setStatus("saving")
    try {
      await onFinish(takeQuiz)
    } catch {
      setStatus("error")
    }
  }

  return (
    <LearnScreen title={lesson.title} onExit={close}>
      <header className="shrink-0 border-b border-border/60 bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={close}
            disabled={saving}
            aria-label="Retour aux révisions"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            {lesson.subject}
          </span>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8">
          <div className="flex flex-col gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary-text">
              <HugeiconsIcon
                icon={BookOpen01Icon}
                className="size-6"
                aria-hidden="true"
              />
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {lesson.title}
            </h1>
            <p className="text-base leading-relaxed text-foreground">
              {lesson.summary}
            </p>
          </div>
          {reference && (
            <aside className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <h2 className="mb-1 text-sm font-semibold">
                {reference.kind === "lesson"
                  ? "Dans ta séance"
                  : "Dans tes devoirs"}
              </h2>
              <blockquote className="text-sm leading-relaxed text-muted-foreground">
                {reference.text}
              </blockquote>
            </aside>
          )}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-semibold">
              Les notions à comprendre
            </h2>
            <dl className="divide-y divide-border/70 border-y border-border/70">
              {lesson.points.map(([name, definition]) => (
                <div key={name} className="py-3">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="mt-1 leading-relaxed text-muted-foreground">
                    {definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {application && (
            <section className="flex flex-col gap-2 rounded-3xl bg-primary/8 p-4">
              <h2 className="font-heading text-lg font-semibold">
                Exemple expliqué
              </h2>
              <p>{application.prompt}</p>
              <p className="leading-relaxed text-muted-foreground">
                {application.explanation}
              </p>
              <p className="font-semibold">Résultat · {application.answer}</p>
            </section>
          )}
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center self-start text-xs text-muted-foreground underline underline-offset-4"
          >
            {source.label}
          </a>
          <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row">
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              disabled={saving}
              onClick={() => void finish(false)}
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                data-icon="inline-start"
                aria-hidden="true"
              />{" "}
              Terminer ma révision
            </Button>
            <Button
              className="min-h-11 flex-1"
              disabled={saving}
              onClick={() => void finish(true)}
            >
              Faire un exercice bilan
            </Button>
          </div>
          {status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              Impossible d’enregistrer cette révision. Réessaie.
            </p>
          )}
        </article>
      </div>
    </LearnScreen>
  )
}
