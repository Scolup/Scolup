import { Button } from "@/components/ui/button"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { cn } from "@/lib/utils"

// Hero of the rubies page, without a card: a big ruby anchors the left edge
// with two thirds of it visible, the balance and the week's earnings sit to
// its right, and the claim button waits on the far right — grayed out when
// there is nothing to claim.
export function RubisHero({
  rubies,
  pending,
  weekRubies,
  onClaim,
}: {
  rubies: number
  pending: number
  weekRubies: number
  onClaim: () => void
}) {
  const hasPending = pending > 0

  return (
    // The clipping wrapper is full-bleed so the ruby's left third sits
    // exactly at the screen edge.
    <div className="overflow-hidden pt-6 pb-4">
      <div className="flex items-center gap-2 pr-4">
        <img
          src="/ruby.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none -ml-11 size-32 shrink-0 opacity-70 dark:opacity-60"
        />

        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-5xl font-semibold text-foreground">
            <AnimatedNumber value={String(rubies)} />
          </span>
          <span className="text-sm text-muted-foreground">
            +{weekRubies} cette semaine
          </span>
        </div>

        <Button
          onClick={onClaim}
          disabled={!hasPending}
          className={cn(
            "ml-auto h-11 shrink-0 px-4 text-sm",
            !hasPending && "bg-muted text-muted-foreground"
          )}
        >
          {hasPending && (
            <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
          )}
          {hasPending ? `Récupérer +${pending}` : "Rien à récupérer"}
        </Button>
      </div>
    </div>
  )
}
