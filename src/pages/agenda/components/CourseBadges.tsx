import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { courseFlags, type Course } from "../helpers"

export function CourseBadges({ course }: { course: Course }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {courseFlags(course).map((flag) => (
        <Badge
          key={flag.key}
          variant={flag.tone}
          size="sm"
          className={flag.icon ? "gap-1" : undefined}
        >
          {flag.icon && <HugeiconsIcon icon={flag.icon} aria-hidden="true" />}
          {flag.label}
        </Badge>
      ))}
    </div>
  )
}
