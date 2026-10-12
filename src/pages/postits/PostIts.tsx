import { m } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon, StickyNote02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/ui/fade-in"
import { EmptyState } from "@/ui/empty-state"
import { InlineError } from "@/ui/inline-error"
import { useDelayedLoading } from "@/hooks/use-delayed-loading"
import { ImageViewer } from "./components/ImageViewer"
import { PostItCard } from "./components/PostItCard"
import { PostItsSkeleton } from "./components/PostItsSkeleton"
import { usePostIts } from "./hooks/usePostIts"

export function PostIts() {
  const page = usePostIts()
  const showSkeleton = useDelayedLoading(page.loading)

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.15, 1] }}
      className="fixed inset-0 z-30 flex flex-col bg-background"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          className="size-11 shrink-0"
          onClick={page.goBack}
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-foreground">
          Post-its
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {page.loading ? (
          showSkeleton ? (
            <PostItsSkeleton />
          ) : null
        ) : page.message ? (
          <InlineError message={page.message} onRetry={page.retry} />
        ) : page.notes.length === 0 ? (
          <EmptyState
            icon={StickyNote02Icon}
            title="Aucun post-it"
            description="Tu n'as aucune annonce de ton établissement pour le moment."
          />
        ) : (
          <FadeIn
            className="columns-2 gap-3 px-4 py-4 sm:columns-3"
            onClick={page.openViewer}
          >
            {page.notes.map((note) => (
              <PostItCard key={note.key} note={note} />
            ))}
          </FadeIn>
        )}
      </div>

      <ImageViewer viewer={page.viewer} onClose={() => page.setViewer(null)} />
    </m.div>
  )
}
