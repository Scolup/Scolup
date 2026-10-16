import { m } from "motion/react"
import { cn } from "@/lib/utils"
import { EASE_OUT } from "@/hooks/use-micro-interactions"
import { resolveSubjectColor, resolveSubjectName } from "@/services/subjects"
import { Badge } from "@/components/ui/badge"
import { CompetencyDots } from "./CompetencyDots"
import { useAverageSettings } from "@/services/average-settings"
import {
  formatAverage,
  formatAverageValue,
  formatGradeDate,
  gradeLabel,
  hasGradeValue,
  type SubjectGroup,
} from "../helpers"
import { subjectVar, tintPill, tintText } from "./tint"

export function SubjectGroupSection({
  group,
  evalColors,
  highlightedKey,
  registerRow,
  onOpen,
}: {
  group: SubjectGroup
  evalColors: string[]
  highlightedKey: string | null
  registerRow: (key: string, el: HTMLElement | null) => void
  onOpen: (key: string) => void
}) {
  const { scale } = useAverageSettings()
  const color = resolveSubjectColor(group.subjectCode, group.subject)
  const display = resolveSubjectName(group.subjectCode, group.subject)

  return (
    <section key={group.subject}>
      <h2 className="flex items-center justify-between gap-2 px-1 pb-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-semibold text-card-foreground">
            {display}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {group.grades.length}
          </span>
        </span>
        <span
          aria-label={
            group.average !== null
              ? `Moyenne : ${formatAverage(group.average, scale)}`
              : "Moyenne non calculable"
          }
          className="shrink-0 tabular-nums"
        >
          {group.average !== null ? (
            <>
              <span className="text-base font-bold text-card-foreground">
                {formatAverageValue(group.average, scale)}
              </span>
              <span className="text-xs text-muted-foreground">
                {scale === 100 ? " %" : `/${scale}`}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </span>
      </h2>
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
        {group.grades.map((grade, index) => {
          const dateLabel = formatGradeDate(grade.date)
          const showCoef = grade.coef !== "1" && grade.coef !== "0"
          return (
            <m.button
              key={grade.key}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: EASE_OUT,
                delay: 0.05 + index * 0.03,
              }}
              ref={(el) => registerRow(grade.key, el)}
              onClick={() => onOpen(grade.key)}
              aria-label={`Voir le détail : ${grade.title}`}
              className={cn(
                "flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-300",
                index > 0 && "border-t border-border/60",
                grade.nonSignificant && "opacity-60",
                highlightedKey === grade.key && "bg-primary/[0.08]"
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-card-foreground">
                    {grade.title}
                  </span>
                  {showCoef && (
                    <Badge
                      variant="outline"
                      size="sm"
                      pill
                      className="shrink-0"
                    >
                      Coef {grade.coef}
                    </Badge>
                  )}
                </span>
                {dateLabel && (
                  <span className="truncate text-xs text-muted-foreground">
                    {dateLabel}
                  </span>
                )}
                <CompetencyDots
                  items={grade.competencies}
                  colors={evalColors}
                />
              </div>
              {hasGradeValue(grade) && (
                <span
                  style={subjectVar(color)}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums",
                    tintPill,
                    tintText
                  )}
                >
                  {gradeLabel(grade)}
                </span>
              )}
            </m.button>
          )
        })}
      </div>
    </section>
  )
}
