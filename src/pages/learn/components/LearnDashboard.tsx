import {
  ArrowRight01Icon,
  Award01Icon,
  BookOpen01Icon,
  ChampionIcon,
  GraduationCapIcon,
  Medal01Icon,
  PencilEdit02Icon,
  Route01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { LearnProgress } from "@/features/learn/progress"
import { cn } from "@/lib/utils"
import { LearnProgressBar } from "./LearnProgressBar"

export type LearnView =
  | "accueil"
  | "parcours"
  | "revisions"
  | "exercices"
  | "gemmes"

const RANKS = [
  {
    title: "Novice",
    from: 0,
    icon: Award01Icon,
    tint: "from-slate-400 to-slate-600",
  },
  {
    title: "Apprenti",
    from: 4,
    icon: Medal01Icon,
    tint: "from-emerald-400 to-emerald-700",
  },
  {
    title: "Confirmé",
    from: 10,
    icon: GraduationCapIcon,
    tint: "from-sky-400 to-sky-700",
  },
  {
    title: "Expert",
    from: 20,
    icon: ChampionIcon,
    tint: "from-amber-400 to-amber-700",
  },
] as const

function Rank({
  completed,
  revisionCount,
  practiceCount,
}: {
  completed: number
  revisionCount: number
  practiceCount: number
}) {
  const total = completed + revisionCount + practiceCount
  const index = RANKS.findLastIndex((rank) => total >= rank.from)
  const rank = RANKS[index]
  const next = RANKS[index + 1]
  return (
    <section
      aria-label="Ta progression"
      className="col-span-2 flex flex-col items-center justify-center gap-2 border-y border-border/70 px-3 py-5 text-center md:col-span-1 md:col-start-2 md:row-start-1 md:border-x md:border-y-0"
    >
      <span
        className={cn(
          "relative grid size-20 shrink-0 place-items-center rounded-[32%] border-4 border-background/85 bg-linear-to-br text-white shadow-md ring-1 ring-border/60 md:size-24",
          rank.tint
        )}
      >
        <HugeiconsIcon
          icon={rank.icon}
          className="size-11"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </span>
      <h2 className="font-heading text-2xl font-bold tracking-tight">
        {rank.title}
      </h2>
      {next && (
        <div className="flex w-full max-w-48 flex-col gap-1.5">
          <LearnProgressBar
            value={total - rank.from}
            max={next.from - rank.from}
            label={`Progression vers le rang ${next.title}`}
            className="h-2.5"
          />
          <p className="text-xs font-medium text-muted-foreground">
            {next.from - total} activité{next.from - total > 1 ? "s" : ""} avant{" "}
            {next.title}
          </p>
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {revisionCount} cours révisé{revisionCount > 1 ? "s" : ""} ·{" "}
        {practiceCount} chapitre{practiceCount > 1 ? "s" : ""} travaillé
        {practiceCount > 1 ? "s" : ""}
      </p>
    </section>
  )
}

const SECTIONS = {
  parcours: {
    icon: Route01Icon,
    title: "Parcours",
    hint: "Termine des étapes et ouvre des coffres.",
  },
  revisions: {
    icon: BookOpen01Icon,
    title: "Révisions",
    hint: "Lis un cours à ton rythme.",
  },
  exercices: {
    icon: PencilEdit02Icon,
    title: "Exercices",
    hint: "Entraîne-toi par matière.",
  },
} as const

function Destination({
  view,
  onOpen,
  completed,
  count,
}: {
  view: keyof typeof SECTIONS
  onOpen: (view: LearnView) => void
  completed?: number
  count?: number
}) {
  const { icon, title, hint } = SECTIONS[view]
  const path = view === "parcours"
  return (
    <button
      type="button"
      onClick={() => onOpen(view)}
      className={cn(
        "relative isolate flex min-h-28 min-w-0 press-lg flex-col justify-between gap-2.5 overflow-hidden rounded-3xl border border-border/70 bg-card p-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:p-4",
        path &&
          "col-start-1 row-start-2 border-primary/20 bg-primary/10 md:row-start-1"
      )}
    >
      {path && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -bottom-16 -z-10 size-44 rounded-full border-[24px] border-primary/10"
        />
      )}
      <span className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary-text",
            path && "bg-primary text-primary-foreground"
          )}
        >
          <HugeiconsIcon icon={icon} className="size-5" aria-hidden="true" />
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-heading text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {hint}
        </span>
        {path && count !== undefined && (
          <span className="mt-1 self-start rounded-full bg-card/85 px-2 py-1 text-[11px] font-semibold tabular-nums">
            {completed}/{count} étapes
          </span>
        )}
      </span>
    </button>
  )
}

export function LearnDashboard({
  completed,
  count,
  progress,
  onOpen,
}: {
  completed: number
  count: number
  progress: LearnProgress
  onOpen: (view: LearnView) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_minmax(12rem,0.72fr)_1fr] md:gap-5">
      <Rank
        completed={completed}
        revisionCount={Object.keys(progress.revisions).length}
        practiceCount={Object.keys(progress.practice).length}
      />
      <Destination
        view="parcours"
        completed={completed}
        count={count}
        onOpen={onOpen}
      />
      <div className="col-start-2 row-start-2 grid auto-rows-fr gap-3 md:col-start-3 md:row-start-1">
        <Destination view="revisions" onOpen={onOpen} />
        <Destination view="exercices" onOpen={onOpen} />
      </div>
    </div>
  )
}
