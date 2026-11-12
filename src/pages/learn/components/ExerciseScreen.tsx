import { useState } from "react"
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { gemsForMistakes } from "@/features/learn/progress"
import { celebrate } from "@/lib/celebrate"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/services/errors"
import { triggerHapticLight, triggerHapticMedium } from "@/services/haptics"
import type { Lesson } from "../curriculum"
import { buildExercises, type Exercise } from "../exercises"
import { LearnScreen } from "./LearnScreen"
import { LearnProgressBar } from "./LearnProgressBar"

interface CheckpointResult {
  best: number
  gained: number
}

interface Attempt {
  answers: string[]
  choice?: string
  result?: CheckpointResult
  saving?: boolean
  error?: string
}

export function ExerciseScreen({
  lesson,
  checkpoint,
  bilan = false,
  onComplete,
  onClose,
}: {
  lesson: Lesson
  checkpoint: boolean
  bilan?: boolean
  onComplete: (mistakes: number) => Promise<CheckpointResult | void>
  onClose: () => void
}) {
  const [questions] = useState(() => {
    const list = buildExercises(
      lesson,
      crypto.getRandomValues(new Uint32Array(1))[0]
    )
    return checkpoint ? list : [...list.slice(0, 2), ...list.slice(3, 6)]
  })
  const [attempt, setAttempt] = useState<Attempt>({ answers: [] })
  const [confirmExit, setConfirmExit] = useState(false)
  const { answers, choice, result, saving, error } = attempt
  const finished = answers.length === questions.length
  const index = Math.min(answers.length, questions.length - 1)
  const question = questions[index]
  const title = bilan ? "Bilan · " + lesson.title : lesson.title
  const right = choice === question.answer
  const mistakes = answers.filter(
    (answer, position) => answer !== questions[position].answer
  ).length
  const checked = Math.min(
    answers.length + Number(choice !== undefined),
    questions.length
  )

  function exit() {
    if (saving) return
    triggerHapticLight()
    if (finished) onClose()
    else setConfirmExit(true)
  }

  async function advance() {
    if (choice === undefined || saving) return
    const nextAnswers = [...answers, choice]
    if (index < questions.length - 1) {
      setAttempt({ answers: nextAnswers })
      return
    }
    setAttempt({ ...attempt, saving: true, error: undefined })
    try {
      const next = await onComplete(mistakes + (right ? 0 : 1))
      setAttempt({ answers: nextAnswers, result: next ?? undefined })
      if (next?.gained) {
        triggerHapticMedium()
        celebrate()
      }
    } catch (err) {
      setAttempt({
        ...attempt,
        error: errorMessage(
          err,
          "Impossible d’enregistrer ta progression. Réessaie."
        ),
      })
    }
  }

  return (
    <LearnScreen title={title} onExit={exit}>
      <header className="mx-auto flex w-full max-w-2xl shrink-0 items-center gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Arrêter l’exercice"
          disabled={saving}
          onClick={exit}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
        </Button>
        <LearnProgressBar
          value={checked}
          max={questions.length}
          label="Progression de la série"
          className="flex-1"
        />
        <span className="min-w-9 text-right text-xs font-semibold text-muted-foreground tabular-nums">
          {checked}/{questions.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-5 px-5 py-6 sm:px-8">
          {finished ? (
            <ExerciseResult
              count={questions.length}
              mistakes={mistakes}
              result={result}
            />
          ) : (
            <ExerciseQuestion
              question={question}
              title={title}
              choice={choice}
              onChoose={(answer) => {
                triggerHapticLight()
                setAttempt({ ...attempt, choice: answer })
              }}
            />
          )}
        </div>
      </div>

      <footer
        className={cn(
          "shrink-0 border-t border-border/60 px-5 pt-3 pb-[calc(0.875rem+env(safe-area-inset-bottom))]",
          choice !== undefined &&
            (right ? "bg-emerald-500/10" : "bg-destructive/8")
        )}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          {!finished && choice !== undefined && (
            <p role="status" className="text-sm">
              <strong className="mr-1">
                {right ? "Bonne réponse !" : "À retenir."}
              </strong>
              {question.explanation}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            className="min-h-12 w-full"
            disabled={!finished && (choice === undefined || saving)}
            onClick={finished ? onClose : () => void advance()}
          >
            {finished
              ? "Terminer"
              : index === questions.length - 1
                ? "Voir mon résultat"
                : "Continuer"}
          </Button>
        </div>
      </footer>

      {confirmExit && (
        <div aria-hidden="true" className="absolute inset-0 z-10 bg-black/30" />
      )}
      <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
        <DialogContent showCloseButton={false} className="z-[80]">
          <DialogHeader>
            <DialogTitle>Veux-tu vraiment arrêter ?</DialogTitle>
            <DialogDescription>
              Les réponses de cette série seront perdues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              className="min-h-11"
              onClick={onClose}
            >
              Arrêter la série
            </Button>
            <Button className="min-h-11" onClick={() => setConfirmExit(false)}>
              Continuer l’exercice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LearnScreen>
  )
}

function ExerciseResult({
  count,
  mistakes,
  result,
}: {
  count: number
  mistakes: number
  result?: CheckpointResult
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-emerald-500/15 text-success-foreground">
        <HugeiconsIcon icon={Tick02Icon} className="size-8" />
      </span>
      <p className="font-heading text-3xl font-bold">Série terminée</p>
      <p className="text-muted-foreground">
        {count - mistakes} bonnes réponses sur {count}
      </p>
      {result && (
        <>
          <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
            <img src="/gem.svg" alt="" className="size-5 object-contain" /> +
            {result.gained} gemmes
          </span>
          {result.gained !== gemsForMistakes(result.best) && (
            <p className="text-xs text-muted-foreground">
              Record du checkpoint · {gemsForMistakes(result.best)} gemmes
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ExerciseQuestion({
  question,
  title,
  choice,
  onChoose,
}: {
  question: Exercise
  title: string
  choice?: string
  onChoose: (answer: string) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h2 className="font-heading text-2xl leading-tight font-semibold text-pretty">
          {question.prompt}
        </h2>
      </div>
      <div className="grid gap-3">
        {question.choices.map((answer, index) => (
          <Button
            key={answer}
            variant="outline"
            aria-pressed={choice === answer}
            disabled={choice !== undefined}
            onClick={() => onChoose(answer)}
            className={cn(
              "min-h-14 justify-start gap-3 rounded-2xl border-b-[3px] px-3 py-2 text-left whitespace-normal disabled:opacity-100",
              choice !== undefined &&
                answer === question.answer &&
                "border-emerald-500/60 bg-emerald-500/12 text-success-foreground",
              choice === answer &&
                answer !== question.answer &&
                "border-destructive/60 bg-destructive/10 text-destructive-foreground"
            )}
          >
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-xl border border-current/15 text-xs"
            >
              {index + 1}
            </span>
            {answer}
          </Button>
        ))}
      </div>
    </>
  )
}
