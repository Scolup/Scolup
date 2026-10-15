"use client"

import {
  Calendar02Icon,
  Calendar03Icon,
  Clock01Icon,
  Comment01Icon,
  Mortarboard01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DetailRow } from "@/ui/detail-row"
import { parseGradeNumber } from "../helpers"
import type { Grade } from "../helpers"

function formatDrawerDate(date?: Date): string {
  if (!date) return ""
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function GradeDrawer({
  grade,
  subject,
  periodLabel,
  evalColors,
  onClose,
}: {
  grade: Grade | null
  subject: string
  periodLabel?: string
  evalColors: string[]
  onClose: () => void
}) {
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
                  {grade.coef !== "1" && grade.coef !== "0" && (
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
              <DetailRow
                icon={Mortarboard01Icon}
                label="Matière"
                value={subject}
              />
              {grade.date && (
                <DetailRow
                  icon={Calendar03Icon}
                  label="Date de l'évaluation"
                  value={formatDrawerDate(grade.date)}
                />
              )}
              {grade.enteredOn &&
                grade.enteredOn.getTime() !== grade.date?.getTime() && (
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
