import { AnimatedNumber } from "@/ui/animated-number"

export function ShopHeader({
  rubies,
  weekText,
}: {
  rubies: number
  weekText: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-10 pb-6">
      <img src="/ruby.svg" alt="" aria-hidden="true" className="size-16" />
      <div className="text-4xl font-semibold">
        <AnimatedNumber value={String(rubies)} />
      </div>
      <div className="text-sm text-muted-foreground">Rubis</div>

      {weekText && (
        <p className="text-center text-xs text-muted-foreground">{weekText}</p>
      )}
    </div>
  )
}
