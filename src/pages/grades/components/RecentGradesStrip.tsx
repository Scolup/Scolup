import { m } from "motion/react"
import { formatDistanceToNowStrict } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { cn } from "@/lib/utils"
import { EASE_OUT, SPRING_POP } from "@/hooks/use-micro-interactions"
import { resolveSubjectColor, resolveSubjectName } from "@/services/subjects"
import {
  formatAverageValue,
  gradeLabel,
  hasGradeValue,
  isGreatGrade,
  type Grade,
} from "../helpers"
import { subjectVar, tintPill, tintText } from "./tint"

export function RecentGradesStrip({
  grades,
  impacts,
  onPick,
}: {
  grades: Grade[]
  impacts?: Map<string, number>
  onPick: (key: string) => void
}) {
  if (grades.length === 0) return null
  return (
    <section aria-label="Notes ajoutées récemment">
      <h2 className="px-1 pb-2 text-sm font-semibold text-card-foreground">
        Ajoutées récemment
      </h2>
      <div className="-mx-4 flex snap-x scroll-pl-4 [scrollbar-width:none] gap-2.5 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden">
        {grades.map((grade, index) => {
          const color = resolveSubjectColor(grade.subjectCode, grade.subject)
          const display = resolveSubjectName(grade.subjectCode, grade.subject)
          // Moment signature : la belle note (≥16/20) pop avec un ressort
          // et garde un halo INTERNE teinté pour qu'on la retrouve en
          // scrollant. Interne, pas externe : le strip scrolle en overflow,
          // un halo externe se ferait couper net au bord du viewport.
          // Les autres cartes gardent leur entrée sobre. Non bloquant,
          // réduit automatiquement via le MotionConfig global.
          const great = isGreatGrade(grade)
          const impact = impacts?.get(grade.key)
          const delay = 0.05 + index * 0.035
          return (
            <m.button
              type="button"
              key={grade.key}
              initial={{ opacity: 0, y: 12, scale: great ? 0.85 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                great
                  ? { ...SPRING_POP, delay }
                  : {
                      duration: 0.4,
                      ease: EASE_OUT,
                      delay,
                    }
              }
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(grade.key)}
              aria-label={`Aller à la note ${grade.title} en ${display}`}
              style={subjectVar(color)}
              className={cn(
                "flex w-44 shrink-0 cursor-pointer snap-start flex-col gap-2 rounded-3xl border p-3.5 text-left",
                tintPill,
                grade.nonSignificant && "opacity-60",
                great && "shadow-[inset_0_0_16px_-4px_var(--c)]"
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-[var(--c)]"
                />
                <span
                  className={cn("truncate text-xs font-semibold", tintText)}
                >
                  {display}
                </span>
              </span>
              <span className="truncate text-sm font-medium text-card-foreground">
                {grade.title}
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {grade.enteredOn instanceof Date
                    ? formatDistanceToNowStrict(grade.enteredOn, {
                        addSuffix: true,
                        locale: fr,
                      })
                    : ""}
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  {hasGradeValue(grade) && (
                    <span
                      className={cn(
                        "text-base font-bold tabular-nums",
                        tintText
                      )}
                    >
                      {gradeLabel(grade)}
                    </span>
                  )}
                  {impact !== undefined && impact !== 0 && (
                    <span
                      className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        impact > 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {impact > 0 ? "+" : ""}
                      {formatAverageValue(impact)}
                    </span>
                  )}
                </span>
              </span>
            </m.button>
          )
        })}
      </div>
    </section>
  )
}
