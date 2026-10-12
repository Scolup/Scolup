import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function AbsencesSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6 px-4 py-4">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((card) => (
          <Skeleton key={card} className="h-20 rounded-2xl" />
        ))}
      </div>
      {[0, 1].map((group) => (
        <div key={group} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            {[0, 1].map((row, index) => (
              <div
                key={row}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  index > 0 && "border-t border-border/60"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-2/3 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
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
