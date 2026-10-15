"use client"

import type { CSSProperties } from "react"
import {
  Building01Icon,
  Clock01Icon,
  DoorIcon,
  Note01Icon,
  TeacherIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useSubjectDisplay } from "@/services/subjects"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { formatTime, fullDateLabel } from "@/services/dates"
import { courseRelativeLabel, durationLabel, type Course } from "../helpers"
import { CourseBadges } from "./CourseBadges"
import { CourseSession } from "./CourseSession"
import { DetailRow } from "@/ui/detail-row"

function timeValue(course: Course): string {
  if (!course.start || !course.end) return "Non précisé"
  const span = `${formatTime(course.start)} – ${formatTime(course.end)}`
  const duration = durationLabel(course)
  return duration ? `${span} · ${duration}` : span
}

export function CourseDrawer({
  course,
  onClose,
}: {
  course: Course | null
  onClose: () => void
}) {
  const { display, color } = useSubjectDisplay(
    course?.subjectCode,
    course?.title
  )

  return (
    <Drawer
      open={!!course}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DrawerContent>
        {course && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-1">
              <span
                className={cn(
                  "text-lg font-bold break-words",
                  !color && "text-card-foreground",
                  color &&
                    "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]",
                  course.cancelled &&
                    "line-through decoration-muted-foreground/50"
                )}
                style={color ? ({ "--c": color } as CSSProperties) : undefined}
              >
                {display}
              </span>
              <span className="text-xs text-muted-foreground">
                {course.start ? fullDateLabel(course.start) : ""}
                {!course.cancelled && courseRelativeLabel(course)
                  ? ` · ${courseRelativeLabel(course)}`
                  : ""}
              </span>
              <CourseBadges course={course} />
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-3">
              <DetailRow
                icon={Clock01Icon}
                label="Horaire"
                value={timeValue(course)}
              />
              {course.room && (
                <DetailRow icon={DoorIcon} label="Salle" value={course.room} />
              )}
              {course.details && (
                <DetailRow
                  icon={Note01Icon}
                  label="Détails"
                  value={course.details}
                />
              )}
              {course.teacher && (
                <DetailRow
                  icon={TeacherIcon}
                  label="Professeur"
                  value={course.teacher}
                />
              )}
              {course.group && (
                <DetailRow
                  icon={Building01Icon}
                  label="Groupe"
                  value={course.group}
                />
              )}
            </div>

            <CourseSession course={course} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
