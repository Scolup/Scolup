import type { Lesson } from "./curriculum"

export const CHECKPOINT_LENGTH = 10

export interface Exercise {
  prompt: string
  choices: string[]
  answer: string
  explanation: string
}

function shuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]
  let state = seed >>> 0
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const other = state % (index + 1)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

const numberLabel = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
  useGrouping: false,
})

function calculation(
  prompt: string,
  answer: number,
  explanation: string,
  step = 1,
  unit = ""
): Exercise {
  const format = (value: number) => numberLabel.format(value) + unit
  return {
    prompt,
    answer: format(answer),
    choices: [answer, answer - step, answer + step].map(format),
    explanation,
  }
}

const TRIANGLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 40, 41],
  [20, 21, 29],
  [12, 35, 37],
]

function appliedExercise(
  id: string,
  index: number,
  seed: number
): Exercise | undefined {
  const a = 2 + index
  const b = 3 + (seed % 4)
  switch (id) {
    case "fractions": {
      const denominator = a + b + 2
      const answer = `${a + b}/${denominator}`
      return {
        prompt: `Calcule ${a}/${denominator} + ${b}/${denominator} en gardant le même dénominateur.`,
        choices: [
          answer,
          `${a + b}/${denominator * 2}`,
          `${a + b + 1}/${denominator}`,
        ],
        answer,
        explanation: `On additionne les numérateurs ${a} et ${b}, puis on garde ${denominator} au dénominateur.`,
      }
    }
    case "proportionnalite":
      return calculation(
        `${a} cahiers coûtent ${a * b} €. Quel est le prix de ${a + 2} cahiers au même prix unitaire ?`,
        (a + 2) * b,
        `Un cahier coûte ${a * b} ÷ ${a} = ${b} €. On multiplie ${b} € par ${a + 2}.`,
        b,
        " €"
      )
    case "perimetre-aire": {
      const perimeter = index % 2 === 0
      return calculation(
        `Un rectangle mesure ${a} cm sur ${b} cm. Calcule ${perimeter ? "son périmètre" : "son aire"}.`,
        perimeter ? 2 * (a + b) : a * b,
        perimeter ? `On calcule 2 × (${a} + ${b}).` : `On calcule ${a} × ${b}.`,
        2,
        perimeter ? " cm" : " cm²"
      )
    }
    case "nombres-relatifs": {
      const subtract = index % 2 === 0
      return calculation(
        `Calcule (−${a}) ${subtract ? "−" : "+"} (−${b}).`,
        subtract ? b - a : -a - b,
        subtract
          ? `Soustraire −${b}, c’est ajouter ${b}.`
          : "Les deux nombres sont négatifs. On additionne leurs distances à zéro et on garde le signe moins."
      )
    }
    case "probabilites": {
      const contrary = index % 2 === 0
      const favorable = contrary ? b : a
      const total = a + b
      const answer = `${favorable}/${total}`
      return {
        prompt: `Un sac contient ${a} jetons rouges et ${b} bleus. On tire un jeton au hasard. Quelle est la probabilité ${contrary ? "de ne pas tirer" : "de tirer"} un jeton rouge ?`,
        choices: [
          answer,
          `${favorable}/${total + 1}`,
          `${favorable + 1}/${total}`,
        ],
        answer,
        explanation: `Il y a ${favorable} issues favorables sur ${total} jetons.`,
      }
    }
    case "pythagore": {
      const [short, long, hyp] = TRIANGLES[index]
      return calculation(
        `Les côtés de l’angle droit d’un triangle mesurent ${short} cm et ${long} cm. Quelle est la longueur de l’hypoténuse ?`,
        hyp,
        `On calcule √(${short}² + ${long}²) = ${hyp}.`,
        1,
        " cm"
      )
    }
    case "cosinus":
    case "trigonometrie": {
      const [opposite, adjacent, hyp] = TRIANGLES[index]
      const kind = id === "cosinus" ? 0 : index % 3
      const ratio = ["cosinus", "sinus", "tangente"][kind]
      const numerator = kind === 0 ? adjacent : opposite
      const denominator = kind === 2 ? adjacent : hyp
      const answer = Math.round((numerator / denominator) * 100) / 100
      return calculation(
        `Pour un angle A d’un triangle rectangle, l’hypoténuse mesure ${hyp} cm, le côté adjacent ${adjacent} cm et le côté opposé ${opposite} cm. Calcule le ${ratio} de A, au centième.`,
        answer,
        `On divise ${numerator} par ${denominator}, puis on arrondit au centième.`,
        0.01
      )
    }
    case "equations":
      return calculation(
        `Résous ${b}x + ${a} = ${b * a + a}.`,
        a,
        `On soustrait ${a} des deux membres, puis on divise par ${b}.`
      )
    case "fonctions":
      return calculation(
        `Soit f(x) = ${b}x + ${a}. Quelle est l’image de ${a + 1} par f ?`,
        b * (a + 1) + a,
        `On remplace x par ${a + 1} et on calcule ${b} × ${a + 1} + ${a}.`
      )
    default:
      return undefined
  }
}

function factExercise(lesson: Lesson, index: number): Exercise {
  const fact = index % lesson.points.length
  const [term, definition] = lesson.points[fact]
  const reverse = index >= lesson.points.length
  const choices = [0, 1, 2].map(
    (offset) =>
      lesson.points[(fact + offset) % lesson.points.length][reverse ? 0 : 1]
  )
  return {
    prompt: reverse
      ? `Quelle notion correspond à cette phrase ? « ${definition} »`
      : `Quelle phrase correspond à « ${term} » ?`,
    choices,
    answer: reverse ? term : definition,
    explanation: definition,
  }
}

export function buildExercises(lesson: Lesson, seed: number): Exercise[] {
  const questions = Array.from(
    { length: CHECKPOINT_LENGTH },
    (_, index) =>
      (index >= 3 ? appliedExercise(lesson.id, index - 3, seed) : undefined) ??
      factExercise(lesson, index)
  )
  return questions.map((question, index) => ({
    ...question,
    choices: shuffle(question.choices, seed + index * 137),
  }))
}
