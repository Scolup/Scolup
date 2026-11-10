import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const skeletonDays = [2, 3, 1]

const skeletonDayWidths = ["w-28", "w-36", "w-24"]

const SUBJECT_WIDTHS = ["w-20", "w-28", "w-24", "w-16", "w-24"]

export function HomeworkListSkeleton() {
  return (
    <div aria-hidden="true" className="pb-6">
      {skeletonDays.map((rows, day) => (
        <Fragment key={day}>
          {day > 0 && (
            <div className="px-4 py-4">
              <Separator className="opacity-60" />
            </div>
          )}
          <div className="px-4 pt-3 pb-1">
            <Skeleton
              className={cn("h-4 rounded-full", skeletonDayWidths[day])}
            />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-1.5">
              <div className="flex items-center gap-3 rounded-2xl border border-transparent bg-input/50 px-3.5 py-3">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton
                    className={cn(
                      "h-3.5 rounded-full",
                      SUBJECT_WIDTHS[(day * 3 + i) % SUBJECT_WIDTHS.length]
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
