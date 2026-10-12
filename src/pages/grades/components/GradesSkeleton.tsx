import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function GradesSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <div className="h-[228px] w-full" />
      <div className="flex flex-col gap-2">
        <div className="px-1">
          <Skeleton className="h-4 w-36 rounded-full" />
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          {[0, 1].map((card) => (
            <div
              key={card}
              className="flex w-44 shrink-0 flex-col gap-2 rounded-3xl border border-border/70 bg-card p-3.5"
            >
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-3.5 w-full rounded-full" />
              <div className="flex items-end justify-between gap-2">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {[0, 1].map((group) => (
        <div key={group} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            {[0, 1, 2].map((row, index) => (
              <div
                key={row}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  index > 0 && "border-t border-border/60"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
