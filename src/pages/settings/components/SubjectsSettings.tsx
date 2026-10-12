"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Book02Icon,
  ChevronDownIcon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { ld } from "@/services/lowdirecte"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/services/errors"
import { useAsync } from "@/hooks/use-async"
import { useLiveRefresh } from "@/hooks/use-live-refresh"
import {
  disciplineSubjects,
  ensureSubjects,
  resetSubject,
  resolveSubjectColor,
  resolveSubjectName,
  seedColor,
  SUBJECT_PICKER_COLORS,
  subjectId,
  updateSubject,
  useSubjects,
  type DisciplineSubject,
} from "@/services/subjects"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface ListedSubject extends DisciplineSubject {
  id: string
}

function checkColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? "#1c1917" : "#ffffff"
}

function SubjectRow({ subject }: { subject: ListedSubject }) {
  const records = useSubjects()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const record = records?.find((entry) => entry.id === subject.id)
  const display = resolveSubjectName(subject.code, subject.name)
  const color = resolveSubjectColor(subject.code, subject.name)
  const autoColor = seedColor(record?.name ?? subject.name)
  const customized = !!record?.customName?.trim() || !!record?.customColor

  const inputValue = draft ?? record?.customName ?? ""
  const dirty =
    draft !== null && draft.trim().slice(0, 60) !== (record?.customName ?? "")

  const saveName = async () => {
    if (!dirty || saving) {
      setDraft(null)
      return
    }
    const next = draft.trim().slice(0, 60)
    setSaving(true)
    try {
      await updateSubject(subject.id, { customName: next })
    } finally {
      setSaving(false)
      setDraft(null)
    }
  }

  const resetColorOnly = async () => {
    const name = record?.customName
    await resetSubject(subject.id)
    if (name?.trim()) await updateSubject(subject.id, { customName: name })
  }

  const pickColor = async (picked: string) => {
    if (saving) return
    if (record?.customColor?.toLowerCase() === picked.toLowerCase()) {
      setSaving(true)
      try {
        await resetColorOnly()
      } finally {
        setSaving(false)
      }
      return
    }
    setSaving(true)
    try {
      await updateSubject(subject.id, { customColor: picked })
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    setDraft(null)
    setSaving(true)
    try {
      await resetSubject(subject.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
        <CollapsibleTrigger
          aria-expanded={open}
          aria-label={`${open ? "Réduire" : "Personnaliser"} ${display}`}
          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            style={{ backgroundColor: color }}
            className="size-4 shrink-0 rounded-full"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-card-foreground">
              {display}
            </span>
            {display !== subject.name && (
              <span className="truncate text-xs text-muted-foreground">
                {subject.name}
              </span>
            )}
            {subject.teacher && (
              <span className="truncate text-xs text-muted-foreground">
                {subject.teacher}
              </span>
            )}
          </span>
          <HugeiconsIcon
            icon={ChevronDownIcon}
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`subject-name-${subject.id}`}>Nom affiché</Label>
              <Input
                id={`subject-name-${subject.id}`}
                value={inputValue}
                maxLength={60}
                placeholder={subject.name}
                autoComplete="off"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                  if (e.key === "Escape") setDraft(null)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Vide = nom d'origine.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-card-foreground">
                Couleur
              </span>
              <div
                role="group"
                aria-label={`Couleur de ${display}`}
                className="grid grid-cols-6 gap-1 sm:grid-cols-10"
              >
                {SUBJECT_PICKER_COLORS.map((option) => {
                  const active = color.toLowerCase() === option.toLowerCase()
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => void pickColor(option)}
                      aria-pressed={active}
                      aria-label={`Choisir la couleur ${option}`}
                      className="flex size-11 items-center justify-center rounded-full transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-95"
                    >
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: option }}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full transition-shadow",
                          active &&
                            "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                        )}
                      >
                        {active && (
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={3}
                            style={{ color: checkColorFor(option) }}
                            className="size-4"
                          />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {record?.customColor ? (
                  <>
                    Personnalisée —{" "}
                    <span className="font-medium">
                      {record.customColor.toUpperCase()}
                    </span>
                    . Couleur automatique :{" "}
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: autoColor }}
                      className="mr-1 inline-block size-2.5 rounded-full align-middle"
                    />
                    <span className="font-medium">
                      {autoColor.toUpperCase()}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Automatique :{" "}
                    <span className="font-medium">
                      {autoColor.toUpperCase()}
                    </span>
                    . Touche une couleur pour la sélectionner, retouche-la pour
                    revenir à l'automatique.
                  </>
                )}
              </p>
            </div>
            {customized && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => void resetAll()}
                  className="gap-1.5"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    className="size-4"
                    aria-hidden="true"
                  />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

const NO_SUBJECTS: ListedSubject[] = []

export function SubjectsSettings() {
  const [reloadKey, setReloadKey] = useState(0)
  useSubjects()
  const liveGrades = useLiveRefresh("grades")
  const { data, error, loading } = useAsync(async () => {
    if (!(await ld.auth.loadSession())) {
      throw new Error("Aucune session active. Reconnecte-toi.")
    }
    const payload = (await ld.grades.getGrades()) as unknown
    const list: ListedSubject[] = disciplineSubjects(payload).map(
      (subject) => ({
        ...subject,
        id: subjectId(subject.code, subject.name),
      })
    )
    await ensureSubjects(
      list.map((subject) => ({ code: subject.code, name: subject.name }))
    )
    return list
  }, [reloadKey, liveGrades])

  const subjects = data ?? NO_SUBJECTS
  const message = error
    ? errorMessage(error, "Impossible de charger les matières.")
    : null

  const content = useMemo(() => {
    if (loading) {
      return (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-3xl" />
          ))}
        </div>
      )
    }
    if (message) {
      return (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          <AlertAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Réessayer
            </Button>
          </AlertAction>
        </Alert>
      )
    }
    if (subjects.length === 0) {
      return (
        <Empty>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Book02Icon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Aucune matière</EmptyTitle>
            <EmptyDescription>
              Tes matières apparaîtront ici dès que ton relevé sera chargé.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }
    return (
      <div className="flex flex-col gap-2">
        {subjects.map((subject) => (
          <SubjectRow key={subject.id} subject={subject} />
        ))}
      </div>
    )
  }, [subjects, loading, message])

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">
        Personnalise le nom et la couleur de chaque matière.
      </p>
      {content}
    </div>
  )
}
