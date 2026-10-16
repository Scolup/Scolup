import { Skeleton } from "@/components/ui/skeleton"

const HEIGHTS = [140, 90, 180, 110, 150, 100]

export function PostItsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-7xl columns-2 gap-3 px-4 py-4 sm:columns-3 lg:columns-4 2xl:columns-5"
    >
      {HEIGHTS.map((height, index) => (
        <Skeleton
          key={index}
          className="mb-3 w-full break-inside-avoid rounded-2xl"
          style={{ height }}
        />
      ))}
    </div>
  )
}
