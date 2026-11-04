import type { Period } from "./types"

// The API lists the all-year period with the bare code `A999Z` and no label.
const PERIOD_LABELS: Record<string, string> = { A999Z: "Année" }

export function toPeriod(raw: Record<string, unknown>): Period | null {
  const id =
    (raw.idPeriode as string) || (raw.codePeriode as string) || undefined
  if (!id) return null
  return {
    id,
    label: (raw.periode as string) || PERIOD_LABELS[id] || id,
    annuel: raw.annuel === true,
  }
}

export function pickDefaultPeriod(periods: Period[]): Period | null {
  return (
    periods.find((period) => period.annuel) ??
    periods.find((period) => period.id === "A999Z") ??
    periods[0] ??
    null
  )
}

export function resolvePeriod(
  periods: Period[],
  preferred: string | undefined
): Period | null {
  return (
    periods.find((period) => period.id === preferred) ??
    pickDefaultPeriod(periods)
  )
}
