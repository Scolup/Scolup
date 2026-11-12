import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CurrencyPill } from "@/components/CurrencyPill"
import { InlineError } from "@/components/InlineError"
import { NextGoalsCard } from "@/components/NextGoalsCard"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  completeCheckpoint,
  completeLearningActivity,
} from "@/features/learn/learnStore"
import {
  gemBalance,
  gemQuests,
  type LearnProgress,
} from "@/features/learn/progress"
import { cn } from "@/lib/utils"
import { ChestScreen } from "./components/ChestScreen"
import { ExerciseScreen } from "./components/ExerciseScreen"
import { GemBank } from "./components/GemBank"
import { LearnDashboard } from "./components/LearnDashboard"
import { LearnPath } from "./components/LearnPath"
import { LearnRecommendations } from "./components/LearnRecommendations"
import { RevisionScreen } from "./components/RevisionScreen"
import { LEVELS, type Level } from "./curriculum"
import { useLearnPage } from "./hooks/useLearnPage"

const TITLES = {
  parcours: "Parcours",
  revisions: "Révisions",
  exercices: "Exercices",
}
type LearnPage = ReturnType<typeof useLearnPage>

function LearnActivity({
  page,
  account,
  level,
  progress,
}: {
  page: LearnPage
  account: string
  level: Level
  progress: LearnProgress
}) {
  const { selection } = page
  switch (selection?.kind) {
    case "review":
      return (
        <RevisionScreen
          key={selection.lesson.id}
          lesson={selection.lesson}
          level={level}
          reference={selection.reference}
          onClose={page.close}
          onFinish={async (takeQuiz) => {
            await completeLearningActivity(
              account,
              "revisions",
              selection.lesson.id
            )
            if (takeQuiz)
              page.select({
                kind: "exercise",
                lesson: selection.lesson,
                bilan: true,
              })
            else page.close()
          }}
        />
      )
    case "exercise":
      return (
        <ExerciseScreen
          key={selection.checkpoint ?? selection.lesson.id}
          lesson={selection.lesson}
          checkpoint={!!selection.checkpoint}
          bilan={selection.bilan}
          onClose={page.close}
          onComplete={(mistakes) =>
            selection.checkpoint
              ? completeCheckpoint(account, selection.checkpoint, mistakes)
              : completeLearningActivity(
                  account,
                  "practice",
                  selection.lesson.id
                )
          }
        />
      )
    case "chest":
      return (
        <ChestScreen
          key={selection.id}
          account={account}
          id={selection.id}
          taps={progress.chests[selection.id] ?? 0}
          prerequisites={selection.prerequisites}
          onClose={page.close}
        />
      )
    default:
      return null
  }
}

function LearnContent({ page }: { page: LearnPage }) {
  const { account, progress, level, view } = page
  if (page.identity.loading || (account && !progress)) {
    return (
      <div
        className="grid gap-3 sm:grid-cols-2"
        aria-busy="true"
        aria-label="Chargement d’Apprendre"
      >
        <Skeleton className="h-44 rounded-3xl sm:col-span-2" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    )
  }
  if (!account || !progress) {
    return (
      <InlineError
        message="Reconnecte-toi à ÉcoleDirecte pour retrouver ton parcours et tes gemmes."
        onRetry={page.retry}
      />
    )
  }
  if (!level) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-3xl border border-border/70 bg-card p-4">
        <h2 className="font-heading text-lg font-semibold">
          Choisis ta classe
        </h2>
        <Select
          onValueChange={(value) => {
            const selected = LEVELS.find(
              (candidate) => String(candidate) === value
            )
            if (selected) page.chooseLevel(selected)
          }}
        >
          <SelectTrigger aria-label="Choisir ta classe" className="min-h-11">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LEVELS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}e
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>
    )
  }

  if (view === "accueil") {
    const quests = gemQuests(progress)
      .filter(({ claimed }) => !claimed)
      .sort((a, b) => b.count / b.goal - a.count / a.goal)
      .slice(0, 3)
    const completed = page.units.reduce(
      (total, unit) =>
        total +
        unit.checkpoints.filter(({ id }) => Object.hasOwn(progress.results, id))
          .length,
      0
    )
    return (
      <>
        <NextGoalsCard
          quests={quests}
          icon="/gem.svg"
          onOpen={() => page.open("gemmes")}
        />
        <LearnDashboard
          completed={completed}
          count={page.lessons.length}
          progress={progress}
          onOpen={page.open}
        />
      </>
    )
  }

  return (
    <>
      {view === "parcours" ? (
        <LearnPath
          units={page.units}
          progress={progress}
          onCheckpoint={(lesson, checkpoint) =>
            page.select({ kind: "exercise", lesson, checkpoint })
          }
          onChest={(id, prerequisites) =>
            page.select({ kind: "chest", id, prerequisites })
          }
        />
      ) : (
        <LearnRecommendations page={page} practice={view === "exercices"} />
      )}
      <LearnActivity
        page={page}
        account={account}
        level={level}
        progress={progress}
      />
    </>
  )
}

export function Learn() {
  const page = useLearnPage()
  const { account, progress, view } = page

  if (view === "gemmes" && account && progress) {
    return (
      <GemBank account={account} progress={progress} onBack={page.closeBank} />
    )
  }

  const title =
    view === "accueil" || view === "gemmes" ? undefined : TITLES[view]

  return (
    <main className="flex w-full flex-col gap-4 px-4 pt-4 pb-6">
      <div className="flex min-h-11 items-center gap-2">
        {title ? (
          <>
            <Button
              aria-label="Retour à Apprendre"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              onClick={() => page.open("accueil")}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
            </Button>
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {title}
            </h1>
          </>
        ) : (
          <h1 className="sr-only">Apprendre</h1>
        )}
        <div className="ml-auto">
          {account && progress && (
            <CurrencyPill
              amount={gemBalance(progress, account)}
              currency="gemmes"
              onOpen={() => page.open("gemmes")}
            />
          )}
        </div>
      </div>
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4",
          view !== "accueil" && "max-w-3xl"
        )}
      >
        <LearnContent page={page} />
      </div>
    </main>
  )
}
