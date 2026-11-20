import {
  Calendar02Icon,
  Calendar03Icon,
  ChartAverageIcon,
  ChartEvaluationIcon,
  Clock01Icon,
  Comment01Icon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DetailRow } from "@/components/DetailRow"
import { useAverageSettings } from "@/features/grades/averageSettings"
import { formatAverage, formatAverageValue } from "@/features/grades/averages"
import { parseGradeNumber } from "@/features/grades/grade"
import type { AverageScale, Grade, GradeImpact } from "@/features/grades/types"

function formatDrawerDate(date?: Date): string {
  if (!date) return ""
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Impact signé et coloré, arrondi avant comparaison pour ne jamais colorer un
// « 0,00 » comme positif.
function ImpactValue({
  impact,
  scale,
}: {
  impact: number | null
  scale: AverageScale
}) {
  if (impact === null) return <span className="text-sm">—</span>
  const points = Math.round(impact * 100) / 100
  return (
    <span
      className={cn(
        "text-sm tabular-nums",
        points > 0
          ? "text-success"
          : points < 0
            ? "text-destructive"
            : "text-muted-foreground"
      )}
    >
      {points > 0 ? "+" : ""}
      {formatAverageValue(points, scale)} pt
    </span>
  )
}

export function GradeDrawer({
  grade,
  subject,
  periodLabel,
  evalColors,
  impact,
  onClose,
  showAllCoefficients = false,
}: {
  grade: Grade | null
  subject: string
  periodLabel?: string
  evalColors: string[]
  impact: GradeImpact | null
  onClose: () => void
  showAllCoefficients?: boolean
}) {
  const { scale } = useAverageSettings()
  return (
    <Drawer
      open={!!grade}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DrawerContent>
        {grade && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-bold break-words text-card-foreground">
                  {grade.title}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {!showAllCoefficients &&
                    grade.coef !== "1" &&
                    grade.coef !== "0" && (
                      <Badge variant="outline" size="sm" pill>
                        Coef {grade.coef}
                      </Badge>
                    )}
                  {grade.typeDevoir && (
                    <Badge variant="outline" size="sm" pill>
                      {grade.typeDevoir}
                    </Badge>
                  )}
                  {grade.nonSignificant && (
                    <Badge variant="outline" size="sm" pill>
                      Non significatif
                    </Badge>
                  )}
                </div>
              </div>
              {grade.value.trim() &&
                (parseGradeNumber(grade.value) !== null ? (
                  <span className="flex shrink-0 flex-col items-end tabular-nums">
                    <span className="text-4xl leading-none font-extrabold tracking-tight text-card-foreground">
                      {grade.value.replace(".", ",")}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      /{grade.outOf}
                    </span>
                  </span>
                ) : (
                  <span className="shrink-0 text-xl font-extrabold text-card-foreground">
                    {grade.value}
                  </span>
                ))}
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-3">
              {impact && (
                <>
                  <DetailRow
                    icon={ChartAverageIcon}
                    label="Impact sur la moyenne générale"
                    value={
                      <ImpactValue impact={impact.general} scale={scale} />
                    }
                  />
                  <DetailRow
                    icon={ChartEvaluationIcon}
                    label="Impact sur la moyenne de la matière"
                    value={
                      <ImpactValue impact={impact.subject} scale={scale} />
                    }
                  />
                </>
              )}
              <DetailRow
                icon={Mortarboard01Icon}
                label="Matière"
                value={subject}
              />
              {showAllCoefficients && (
                <DetailRow
                  icon={ChartEvaluationIcon}
                  label="Coefficient"
                  value={grade.coef.replace(".", ",")}
                />
              )}
              {grade.classAverage !== undefined && (
                <DetailRow
                  icon={ChartAverageIcon}
                  label="Moyenne de la classe"
                  value={formatAverage(grade.classAverage, scale)}
                />
              )}
              {grade.date && (
                <DetailRow
                  icon={Calendar03Icon}
                  label="Date de l'évaluation"
                  value={formatDrawerDate(grade.date)}
                />
              )}
              {grade.enteredOn && (
                <DetailRow
                  icon={Clock01Icon}
                  label="Saisie le"
                  value={formatDrawerDate(grade.enteredOn)}
                />
              )}
              {periodLabel && (
                <DetailRow
                  icon={Calendar02Icon}
                  label="Période"
                  value={periodLabel}
                />
              )}
              {grade.comment && (
                <DetailRow
                  icon={Comment01Icon}
                  label="Commentaire"
                  value={grade.comment}
                />
              )}
              {grade.competencies.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Compétences · {grade.competencies.length}
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {grade.competencies.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-input/50 px-3 py-2.5"
                      >
                        <span
                          aria-hidden="true"
                          style={
                            item.level !== null
                              ? {
                                  backgroundColor: evalColors[item.level - 1],
                                }
                              : undefined
                          }
                          className={cn(
                            "size-3 shrink-0 rounded-full",
                            item.level === null && "bg-muted-foreground/40"
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
                          {item.label}
                        </span>
                        {item.level !== null && (
                          <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                            {item.level}/4
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
