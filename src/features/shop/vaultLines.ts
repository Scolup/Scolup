import type { VaultState } from "./vault"

// José parle peu et à demi-mot. Toutes ses répliques sont ici, pour les
// réécrire sans toucher à l'interface.

export type JoseMood = "idle" | "thinking" | "nope" | "near" | "hint" | "happy"

const GREETINGS = [
  "Psst… Approche. Tu as quelque chose à me dire ?",
  "Le coffre est fermé. Mais je suis tout ouïe.",
  "Chut. Ici, on murmure.",
]

const THINKING = ["Voyons voir…", "Laisse-moi écouter le coffre…", "Hmm…"]

const WRONG = [
  "Hmm… Ce mot ne résonne dans aucune pièce du coffre.",
  "Les murs ont écouté. Ils n’ont rien reconnu.",
  "Non. Mais j’ai senti que tu y croyais.",
  "Ce n’est pas la bonne clé. Cherche encore.",
  "…Même la poussière a haussé un sourcil.",
  "Je n’ai jamais entendu ça. Et pourtant, j’entends tout.",
  "Peut-être un jour. Pas aujourd’hui.",
]

const NEAR = [
  "Oh… ça chatouille. Tu n’es pas loin.",
  "Je sens quelque chose. Un détail, peut-être ?",
  "Tu chauffes. Relis ce que tu as tapé.",
  "Presque. Le coffre a frémi, j’ai vu.",
]

const USED = [
  "Celui-là, tu me l’as déjà soufflé. Le coffre ne donne qu’une fois.",
  "Déjà trouvé ! Je ne t’oublie pas… et toi non plus, j’espère.",
]

const WIN = [
  "Là… tu viens de trouver quelque chose.",
  "Le coffre s’ouvre. Je ne l’avais pas vu venir !",
  "Tu l’as trouvé. Profites-en, il ne s’ouvre pas pour tout le monde.",
]

const ERROR = ["Le coffre est coincé… réessaie dans un instant."]

const EMPTY = [
  "Les secrets se cachent là où personne ne regarde.",
  "Certains mots traînent près des nouveautés.",
  "Écoute bien : un code n’est jamais loin d’un sourire.",
  "Ouvre l’œil. Et l’oreille, surtout.",
]

const ALL_FOUND = [
  "Tu as tout trouvé… pour l’instant. Reviens me voir.",
  "Plus rien à te cacher. Mais je finis toujours par en retrouver.",
]

// Une réplique au hasard, jamais deux fois la même d'affilée.
export function pickDifferent(
  pool: readonly string[],
  previous: string,
  random: () => number = Math.random
): string {
  const options = pool.length > 1 ? pool.filter((l) => l !== previous) : pool
  return options[Math.floor(random() * options.length)]
}

export const greeting = (random?: () => number) =>
  pickDifferent(GREETINGS, "", random)
export const thinkingLine = (previous: string) =>
  pickDifferent(THINKING, previous)
export const wrongLine = (previous: string) => pickDifferent(WRONG, previous)
export const nearLine = (previous: string) => pickDifferent(NEAR, previous)
export const usedLine = (previous: string) => pickDifferent(USED, previous)
export const winLine = (previous: string) => pickDifferent(WIN, previous)
export const errorLine = (previous: string) => pickDifferent(ERROR, previous)

export interface EmptyLine {
  text: string
  length?: number // forme du code dont parle l'indice
}

// Champ vide : José glisse l'indice d'un code encore caché, chaque touche
// passant au suivant. Sans indice à donner (ou si le même reviendrait deux
// fois de suite), il se contente d'une phrase vague.
export function emptyFieldLine(
  vault: VaultState,
  count: number,
  previous: string,
  random?: () => number
): EmptyLine {
  const hint = vault.hints[count % Math.max(1, vault.hints.length)]
  if (hint && hint.text !== previous) return hint
  const done = vault.total > 0 && vault.found.length === vault.total
  return { text: pickDifferent(done ? ALL_FOUND : EMPTY, previous, random) }
}
