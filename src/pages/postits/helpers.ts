export interface PostIt {
  key: string
  html: string
  date?: string
  author?: string
  tint: string
}

export const NO_NOTES: PostIt[] = []

const NOTE_TINTS = [
  "border-amber-200/70 bg-amber-100 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
  "border-pink-200/70 bg-pink-100 text-pink-950 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-100",
  "border-sky-200/70 bg-sky-100 text-sky-950 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100",
  "border-emerald-200/70 bg-emerald-100 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  "border-violet-200/70 bg-violet-100 text-violet-950 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100",
]

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function tintFor(raw: Record<string, unknown>, index: number): string {
  const match = asString(raw.type).match(/(\d+)\s*$/)
  const n = match ? Number(match[1]) : Number(raw.id)
  const i = Number.isFinite(n) ? Math.abs(n) : index
  return NOTE_TINTS[i % NOTE_TINTS.length]
}

export function toPostIt(
  raw: Record<string, unknown>,
  index: number
): PostIt | null {
  const html = asString(raw.contenu)
  if (!html) return null
  const auteur = raw.auteur as Record<string, unknown> | undefined
  const author =
    auteur &&
    [asString(auteur.prenom), asString(auteur.nom)].filter(Boolean).join(" ")
  return {
    key: String((raw.id as number | string | undefined) ?? `postit-${index}`),
    html,
    date: asString(raw.dateDebut) || asString(raw.dateCreation) || undefined,
    author: author || undefined,
    tint: tintFor(raw, index),
  }
}
