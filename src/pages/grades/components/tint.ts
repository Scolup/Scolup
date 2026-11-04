import type { CSSProperties } from "react"

export function subjectVar(color: string): CSSProperties {
  return { "--c": color } as CSSProperties
}

export const tintText =
  "text-[color-mix(in_srgb,var(--c)_60%,black)] dark:text-[color-mix(in_srgb,var(--c)_60%,white)]"

export const tintPill =
  "border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_13%,var(--card))] dark:bg-[color-mix(in_srgb,var(--c)_20%,var(--card))]"
