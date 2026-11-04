import { Skeleton } from "@/components/ui/skeleton"

// Same shapes as the loaded shop: a decorated banner with a row of uniform
// bubble cards, twice. Shown only while the first inventory read is slow
// (see useDelayedLoading): local IndexedDB loads never flash it.
export function ShopSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-7 px-4 pt-6 pb-10">
      {Array.from({ length: 2 }, (_, section) => (
        <div key={section} className="flex flex-col gap-2.5">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, tile) => (
              <Skeleton key={tile} className="h-19 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
