// Interpolation ease-out pour le count-up de la moyenne : pure, testée,
// la partie rAF vit dans AverageCard. `progress` est clampé à [0, 1].
export function countUpValue(
  from: number,
  to: number,
  progress: number
): number {
  const t = Math.min(1, Math.max(0, progress))
  const eased = 1 - Math.pow(1 - t, 3)
  return from + (to - from) * eased
}
