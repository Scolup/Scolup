import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChevronDownIcon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { triggerHapticLight } from "@/services/haptics"
import { defaultSubjectCoef } from "@/features/subjects/names"
import { type DisciplineSubject } from "@/features/subjects/disciplines"
import { resetSubject, updateSubject } from "@/features/subjects/edit"
import {
  resolveSubjectCoef,
  resolveSubjectColor,
  resolveSubjectName,
} from "@/features/subjects/resolve"
import { useSubjects } from "@/features/subjects/store"
import { SUBJECT_PICKER_COLORS } from "@/features/subjects/colors"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface ListedSubject extends DisciplineSubject {
  id: string
}

function checkColorFor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? "#1c1917" : "#ffffff"
}

export function SubjectRow({ subject }: { subject: ListedSubject }) {
  const records = useSubjects()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [coefDraft, setCoefDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const record = records?.find((entry) => entry.id === subject.id)
  const display = resolveSubjectName(subject.code, subject.name)
  const color = resolveSubjectColor(subject.code, subject.name)
  const defaultCoef = defaultSubjectCoef(record?.name ?? subject.name)
  const coef = resolveSubjectCoef(subject.code, subject.name)
  const customized =
    !!record?.customName?.trim() ||
    !!record?.customColor ||
    coef !== defaultCoef

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

  const applyCoef = (raw: string) => {
    const parsed = raw.trim().replace(",", ".")
    const value = parsed === "" ? 1 : Number(parsed)
    const next = Number.isFinite(value) && value > 0 ? value : coef
    if (next !== coef) void updateSubject(subject.id, { coef: next })
  }

  const resetColorOnly = async () => {
    const name = record?.customName
    await resetSubject(subject.id)
    if (name?.trim() || coef !== defaultCoef) {
      await updateSubject(subject.id, { customName: name, coef })
    }
  }

  const pickColor = async (picked: string) => {
    if (saving) return
    if (record?.customColor?.toLowerCase() === picked.toLowerCase()) {
      setSaving(true)
      try {
        await resetColorOnly()
        if (color.toLowerCase() !== picked.toLowerCase()) triggerHapticLight()
      } finally {
        setSaving(false)
      }
      return
    }
    setSaving(true)
    try {
      await updateSubject(subject.id, { customColor: picked })
      if (color.toLowerCase() !== picked.toLowerCase()) triggerHapticLight()
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    setDraft(null)
    setSaving(true)
    try {
      await resetSubject(subject.id)
      triggerHapticLight()
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
          className="flex min-h-14 w-full press-lg items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50"
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
              "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`subject-coef-${subject.id}`}>Coefficient</Label>
              <Input
                id={`subject-coef-${subject.id}`}
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={coefDraft ?? String(coef)}
                placeholder="1"
                autoComplete="off"
                onChange={(e) => {
                  setCoefDraft(e.target.value)
                  applyCoef(e.target.value)
                }}
                onBlur={() => setCoefDraft(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                  if (e.key === "Escape") setCoefDraft(null)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-card-foreground">
                Couleur
              </span>
              <div
                role="group"
                aria-label={`Couleur de ${display}`}
                className="grid grid-cols-6 gap-3"
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
                          "flex size-9 items-center justify-center rounded-full transition-shadow",
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
