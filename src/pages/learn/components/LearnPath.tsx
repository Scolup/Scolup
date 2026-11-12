import { useState } from "react"
import { GiftIcon, Route01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CHEST_TAPS, type LearnProgress } from "@/features/learn/progress"
import { cn } from "@/lib/utils"
import { triggerHapticLight } from "@/services/haptics"
import type { Lesson } from "../curriculum"
import type { LearnUnit } from "../path"
import { SUBJECT_STYLE } from "../subjectStyle"
import { ChestArt } from "./ChestArt"
import { LearnProgressBar } from "./LearnProgressBar"

function UnitHeader({
  id,
  index,
  done,
  count,
  current,
  hasChest,
}: {
  id: string
  index: number
  done: number
  count: number
  current: boolean
  hasChest: boolean
}) {
  const finished = done === count
  return (
    <header
      className={cn(
        "flex gap-3 rounded-2xl border border-border/70 bg-muted/45 p-3",
        (current || finished) && "border-emerald-500/25 bg-emerald-500/8"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "w-1.5 shrink-0 self-stretch rounded-full bg-border",
          (current || finished) && "bg-emerald-500"
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <h2
            id={id}
            className="flex items-center gap-1.5 font-heading font-semibold"
          >
            <HugeiconsIcon
              icon={Route01Icon}
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Unité {index + 1}
          </h2>
          <span
            className={cn(
              "rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground",
              current && "bg-primary text-primary-foreground",
              finished && "bg-emerald-500/15 text-success-foreground"
            )}
          >
            {finished ? "Terminée" : current ? "En cours" : "À venir"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-background/75 px-2 py-0.5 text-[11px] font-medium tabular-nums">
            {done}/{count} étapes
          </span>
          {hasChest && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <HugeiconsIcon
                icon={GiftIcon}
                className="size-3"
                aria-hidden="true"
              />{" "}
              Coffre
            </span>
          )}
        </div>
        <LearnProgressBar
          value={done}
          max={count}
          label={`Progression de l’unité ${index + 1}`}
          className="h-1.5"
        />
      </div>
    </header>
  )
}

function PathCheckpoint({
  lesson,
  state,
  onStart,
}: {
  lesson: Lesson
  state: "locked" | "current" | "completed"
  onStart: () => void
}) {
  const [open, setOpen] = useState(false)
  const locked = state === "locked"
  const completed = state === "completed"
  const current = state === "current"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label={
          lesson.title +
          (locked ? ", verrouillé" : completed ? ", terminé" : "")
        }
        aria-current={current ? "step" : undefined}
        onClick={triggerHapticLight}
        className={cn(
          "relative grid size-[4.25rem] shrink-0 press-lg place-items-center rounded-full border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card",
          locked &&
            "border-border bg-muted text-muted-foreground shadow-[0_5px_0_var(--border)]",
          completed &&
            "border-emerald-500/35 bg-emerald-500/15 text-success-foreground shadow-[0_5px_0_#05966945]",
          current &&
            "border-emerald-400/45 bg-emerald-600 text-white shadow-[0_6px_0_#08704d] ring-4 ring-emerald-500/20 ring-offset-2 ring-offset-card"
        )}
      >
        <HugeiconsIcon
          icon={SUBJECT_STYLE[lesson.subject].icon}
          className="size-8"
          strokeWidth={2}
          aria-hidden="true"
        />
        {completed && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              className="size-3"
              strokeWidth={2.8}
            />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        sideOffset={13}
        className="w-[min(16.5rem,calc(100vw-2rem))] gap-3 border border-border/70"
      >
        <PopoverHeader>
          <PopoverTitle className="font-heading font-semibold">
            {lesson.title}
          </PopoverTitle>
          <PopoverDescription>
            {locked
              ? "Termine les checkpoints précédents pour continuer."
              : lesson.subject + " · 10 questions"}
          </PopoverDescription>
        </PopoverHeader>
        <Button
          className="min-h-11 w-full"
          disabled={locked}
          onClick={() => {
            setOpen(false)
            onStart()
          }}
        >
          {locked ? "Verrouillé" : completed ? "Rejouer" : "Commencer"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function LearnPath({
  units,
  progress,
  onCheckpoint,
  onChest,
}: {
  units: readonly LearnUnit[]
  progress: LearnProgress
  onCheckpoint: (lesson: Lesson, id: string) => void
  onChest: (id: string, prerequisites: string[]) => void
}) {
  const done = (id: string) => Object.hasOwn(progress.results, id)
  const next = units
    .flatMap((unit) => unit.checkpoints)
    .find(({ id }) => !done(id))?.id

  return (
    <div className="flex flex-col gap-5">
      {units.map(({ id, checkpoints, chestId }, unitIndex) => {
        const prerequisites = checkpoints.map((checkpoint) => checkpoint.id)
        const ready = prerequisites.every(done)
        const opened = chestId ? progress.chests[chestId] === CHEST_TAPS : false
        return (
          <section
            key={id}
            aria-labelledby={"unit-" + id}
            className="rounded-3xl border border-border/70 bg-card"
          >
            <UnitHeader
              id={"unit-" + id}
              index={unitIndex}
              done={prerequisites.filter(done).length}
              count={checkpoints.length}
              current={checkpoints.some(({ id }) => id === next)}
              hasChest={!!chestId}
            />
            <div className="relative isolate mx-auto max-w-sm">
              {checkpoints.length > 1 && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 280 334"
                  className="pointer-events-none absolute top-6 left-1/2 -z-10 h-[20.875rem] w-[17.5rem] -translate-x-1/2 text-border"
                >
                  <path
                    d={
                      chestId
                        ? "M140 34 C140 83 202 83 202 130 S140 178 140 226 S78 278 78 328"
                        : "M140 34 C140 83 202 83 202 130"
                    }
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="1 14"
                    fill="none"
                  />
                </svg>
              )}
              <ol className="flex flex-col items-center px-3 py-6">
                {checkpoints.map(({ id: key, lesson }, index) => (
                  <li
                    key={key}
                    className={cn(
                      "flex h-24 justify-center",
                      index === 1 && "translate-x-[3.875rem]"
                    )}
                  >
                    <PathCheckpoint
                      lesson={lesson}
                      state={
                        done(key)
                          ? "completed"
                          : key === next
                            ? "current"
                            : "locked"
                      }
                      onStart={() => onCheckpoint(lesson, key)}
                    />
                  </li>
                ))}
                {chestId && (
                  <li className="-translate-x-[3.875rem]">
                    <button
                      type="button"
                      aria-label={
                        opened
                          ? "Voir le coffre ouvert"
                          : ready
                            ? "Ouvrir le coffre"
                            : "Coffre verrouillé"
                      }
                      disabled={!ready}
                      onClick={() => onChest(chestId, prerequisites)}
                      className={cn(
                        "grid size-20 press-lg place-items-center rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        !ready && "opacity-60"
                      )}
                    >
                      <ChestArt
                        tier={ready ? 0 : -1}
                        open={opened}
                        className="text-[4rem]"
                      />
                    </button>
                  </li>
                )}
              </ol>
            </div>
          </section>
        )
      })}
    </div>
  )
}
