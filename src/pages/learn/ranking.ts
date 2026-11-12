import type { Lesson, Subject } from "./curriculum"

export interface SchoolSignal {
  kind: "lesson" | "homework" | "grade"
  subject: string
  text: string
  weight: number
}

export type Similarities = Record<string, number[]>

const SUBJECT_NAMES: Record<Subject, RegExp> = {
  Mathématiques: /\bmath\w*/u,
  Français: /\bfran[cç]\w*/u,
  "Histoire-géographie": /\b(histoire|geo\w*)\b/u,
  SVT: /\b(svt|sciences de la vie)\b/u,
  "Physique-chimie": /\b(physique|chimie|sciences et technologie)\b/u,
  Anglais: /\banglais\b/u,
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

function tokens(text: string) {
  return new Set(
    normalize(text)
      .match(/[a-z0-9]{4,}/gu)
      ?.map((word) => word.replace(/s$/u, ""))
  )
}

export function rankLessons(
  lessons: readonly Lesson[],
  signals: readonly SchoolSignal[],
  similarities?: Similarities
) {
  const inputs = signals.map((signal) => ({
    ...signal,
    subjectMatch: Object.entries(SUBJECT_NAMES).find(([, match]) =>
      match.test(normalize(signal.subject))
    )?.[0],
    tokens: tokens(signal.text),
  }))
  return lessons
    .map((lesson) => {
      const keywords = tokens(`${lesson.title} ${lesson.keywords}`)
      let score = 0
      const reasons = new Set<SchoolSignal["kind"]>()
      const focus = new Set<string>()
      let reference: Pick<SchoolSignal, "kind" | "text"> | undefined
      let referenceScore = 0
      for (const [index, signal] of inputs.entries()) {
        if (signal.subjectMatch && signal.subjectMatch !== lesson.subject)
          continue
        let matches = 0
        for (const word of keywords) if (signal.tokens.has(word)) matches++
        const similarity = similarities?.[lesson.id]?.[index] ?? 0
        const semantic = Math.max(0, similarity - 0.78) * 8
        const relevance = signal.weight * (Math.min(matches, 4) + semantic)
        score += relevance
        if (!matches && semantic <= 0.2) continue
        reasons.add(signal.kind)
        if (signal.kind === "grade") continue
        for (const word of signal.tokens) focus.add(word)
        if (relevance > referenceScore) {
          reference = { kind: signal.kind, text: signal.text }
          referenceScore = relevance
        }
      }
      const pointScore = ([name]: Lesson["points"][number]) =>
        [...tokens(name)].filter((word) => focus.has(word)).length
      const points = focus.size
        ? [...lesson.points].sort((a, b) => pointScore(b) - pointScore(a))
        : lesson.points
      return {
        lesson: { ...lesson, points },
        score,
        reasons: [...reasons],
        reference,
      }
    })
    .sort((a, b) => b.score - a.score)
}
