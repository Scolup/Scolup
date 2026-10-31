import { Button } from "@/components/ui/button"
import { AnimatedNumber } from "@/ui/animated-number"

export function ShopHeader({
  rubies,
  pending,
  weekText,
  onClaim,
}: {
  rubies: number
  pending: number
  weekText: string | null
  onClaim: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-10 pb-6">
      <img src="/ruby.svg" alt="" aria-hidden="true" className="size-16" />
      <div className="text-4xl font-semibold">
        <AnimatedNumber value={String(rubies)} />
      </div>
      <div className="text-sm text-muted-foreground">Rubis</div>

      {pending > 0 && (
        <Button onClick={onClaim} className="h-11 gap-2 px-5">
          <img src="/ruby.svg" alt="" aria-hidden="true" className="size-4" />
          Récupérer +{pending}
        </Button>
      )}

      {weekText && (
        <p className="text-center text-xs text-muted-foreground">{weekText}</p>
      )}
    </div>
  )
}
