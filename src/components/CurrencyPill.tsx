import { AnimatedNumber } from "./AnimatedNumber"

export function CurrencyPill({
  amount,
  currency,
  onOpen,
}: {
  amount: number
  currency: "rubis" | "gemmes"
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${amount} ${currency} · quêtes et boutique`}
      className="flex h-11 press items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <img
        src={currency === "rubis" ? "/ruby.svg" : "/gem.svg"}
        alt=""
        className="size-5 object-contain"
      />
      <span className="text-sm font-medium text-card-foreground">
        <AnimatedNumber value={String(amount)} />
      </span>
    </button>
  )
}
