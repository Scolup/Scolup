export const onlineKeywords = [
  "distanciel",
  "visio",
  "visioconference",
  "classe virtuelle",
  "teams",
  "zoom",
  "en ligne",
]

export const evaluatedKeywords = [
  "devoir surveille",
  "devoir commun",
  "evaluation",
  "controle",
  "examen",
  "epreuve",
  "brevet",
  "bac blanc",
  "qcm note",
  "interrogation",
  " ds",
  "(ds)",
]

export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export const lunchKeywords = [
  "repas",
  "dejeuner",
  "cantine",
  "self",
  "meridienne",
  "restauration",
  "demi-pension",
  "pause midi",
]

export const breakKeywords = [
  "recreation",
  "permanence",
  "etude",
  "pause",
  "vie scolaire",
]
