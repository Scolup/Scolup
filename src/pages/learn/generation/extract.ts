// Turns a course into facts. Every extractor prefers to find nothing over
// finding something wrong: a missing exercise costs less than a false one.

import { PAIR_SEPARATOR, classifyLines } from "./blocks"
import type { Line } from "./blocks"
import type { DefinitionFact, Fact, PairFact, QuestionFact } from "./facts"
import { normalizeText } from "./normalize"

export function extractFacts(raw: string): Fact[] {
  const lines = classifyLines(normalizeText(raw))
  return [
    ...extractPairs(lines),
    ...extractQuestions(lines),
    ...extractDefinitions(lines),
  ]
}

const wordsOf = (text: string) => text.split(/\s+/u).filter(Boolean)

// ---------------------------------------------------------------------------
// Vocabulary pairs
// ---------------------------------------------------------------------------

// OCR and PDF copies often drop the line breaks of a vocabulary list:
//   "chat = cat chien = dog"
// Nothing marks where "cat" ends and "chien" begins, so we guess from tiny
// French/English hints, and drop the pairs we cannot guess with confidence.
// NOTE: no dictionary yet. Words ending in -er (French verbs) look English,
// so those lists are mostly dropped. Upgrade path: a word list per language.
const FRENCH_WORDS = new Set([
  ...["de", "du", "des", "le", "la", "les", "un", "une", "et", "à", "au"],
  ...["aux", "en", "sur", "sous", "dans", "pour", "par", "avec", "sans"],
  ...["qui", "que", "où"],
])
const ENGLISH_WORDS = new Set([
  ...["the", "a", "an", "of", "to", "in", "at", "for", "with", "and"],
  ...["who", "that", "is", "be"],
])
const FRENCH_ENDING = /(?:eurs?|euses?|iers?|ières?|istes?|eux|iques?)$/u
const ENGLISH_ENDING = /(?:ing|ists?|ians?|ly|ness|ship|ers?|ors?|ar)$/u
const ACCENT = /[àâäçéèêëîïôöùûüÿœæ]/u
// A term does not start with "de" and an English term does not end on an article.
const NEVER_FIRST = new Set(["de", "du", "des"])
const NEVER_LAST = new Set(["the", "a", "an", "of"])

// Positive means French-looking, negative English-looking.
function frenchScore(word: string) {
  const lower = word.toLowerCase()
  let score = 0
  if (ACCENT.test(lower)) score += 2
  if (FRENCH_WORDS.has(lower)) score += 2
  if (ENGLISH_WORDS.has(lower)) score -= 2
  if (FRENCH_ENDING.test(lower)) score += 1
  else if (ENGLISH_ENDING.test(lower)) score -= 1
  return score
}

const phraseScore = (words: string[]) =>
  words.reduce((sum, word) => sum + frenchScore(word), 0)

function splitScore(french: string[], english: string[]) {
  const first = french[0]?.toLowerCase() ?? ""
  const last = english.at(-1)?.toLowerCase() ?? ""
  return (
    phraseScore(french) -
    phraseScore(english) -
    (NEVER_FIRST.has(first) ? 2 : 0) -
    (NEVER_LAST.has(last) ? 2 : 0)
  )
}

// "street performer magon" sits between two "=": it is the end of one pair
// followed by the start of the next. Find where to cut, or give up.
function splitMiddle(
  words: string[],
  frenchOnLeft: boolean
): [string, string] | undefined {
  const candidates = []
  for (let at = 1; at < words.length; at++) {
    const first = words.slice(0, at)
    const second = words.slice(at)
    const score = frenchOnLeft
      ? splitScore(second, first)
      : splitScore(first, second)
    candidates.push({ at, score })
  }
  candidates.sort((a, b) => b.score - a.score)
  const [best, runnerUp] = candidates
  if (!best || best.score < 1) return
  if (runnerUp && best.score - runnerUp.score < 2) return
  return [words.slice(0, best.at).join(" "), words.slice(best.at).join(" ")]
}

// Which side of "=" is French, judged on the outer words of every line, the
// only ones that need no cutting. One weak hint is not enough to decide.
function isFrenchOnLeft(rows: string[][]) {
  let balance = 0
  for (const parts of rows) {
    balance += phraseScore(wordsOf(parts[0]))
    balance -= phraseScore(wordsOf(parts[parts.length - 1]))
  }
  if (balance >= 3) return true
  if (balance <= -3) return false
}

function pairsOf(parts: string[], frenchOnLeft: boolean | undefined) {
  const count = parts.length - 1
  if (count === 1) return [[parts[0], parts[1]]]
  if (frenchOnLeft === undefined) return []
  const lefts = [parts[0]]
  const rights: string[] = []
  const unsure = new Set<number>()
  for (let index = 1; index < count; index++) {
    const split = splitMiddle(wordsOf(parts[index]), frenchOnLeft)
    // A bad cut spoils the pair before it and the pair after it.
    if (!split) unsure.add(index - 1).add(index)
    rights.push(split?.[0] ?? "")
    lefts.push(split?.[1] ?? "")
  }
  rights.push(parts[count])
  return lefts.flatMap((left, index) =>
    unsure.has(index) ? [] : [[left, rights[index]]]
  )
}

// A few lines with "=" in a row are a vocabulary list; a lone one may be a
// formula or a sentence.
function pairRuns(lines: Line[]) {
  const runs: string[][] = []
  let inRun = false
  for (const line of lines) {
    if (line.kind !== "pairs") {
      inRun = false
      continue
    }
    if (inRun) runs[runs.length - 1].push(line.text)
    else runs.push([line.text])
    inRun = true
  }
  return runs
}

function extractPairs(lines: Line[]): PairFact[] {
  const facts: PairFact[] = []
  for (const run of pairRuns(lines)) {
    const rows = run.map((text) => text.split(PAIR_SEPARATOR))
    const separators = rows.reduce((sum, parts) => sum + parts.length - 1, 0)
    if (separators < 3) continue
    const frenchOnLeft = isFrenchOnLeft(rows)
    for (const [index, parts] of rows.entries()) {
      for (const [left, right] of pairsOf(parts, frenchOnLeft)) {
        facts.push({ kind: "pair", left, right, source: run[index] })
      }
    }
  }
  return facts
}

// ---------------------------------------------------------------------------
// Questions: a heading that asks something, followed by its answer
// ---------------------------------------------------------------------------

// NOTE: a longer answer is skipped, it would not fit a flashcard.
const MAX_ANSWER_LENGTH = 800

function extractQuestions(lines: Line[]): QuestionFact[] {
  const facts: QuestionFact[] = []
  for (const [index, line] of lines.entries()) {
    if (line.kind !== "heading" || !line.question) continue
    const body: string[] = []
    for (const next of lines.slice(index + 1)) {
      if (next.kind === "heading") break
      if (next.kind === "example") continue
      body.push(next.kind === "bullet" ? `• ${next.text}` : next.text)
    }
    const answer = body.join("\n")
    if (answer && answer.length <= MAX_ANSWER_LENGTH) {
      facts.push({ kind: "question", question: line.text, answer })
    }
  }
  return facts
}

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

// The term must start with an article: "Elle correspond à…" is skipped because
// we cannot tell what "Elle" is, and "Les lois sont votées" because a passive
// is not a definition.
const IS_A =
  /^((?:l['’]|(?:le|la|les|un|une|des|du)\s)[^,;:()]{1,60}?)\s(?:est|sont|désigne|désignent|s['’]appelle|s['’]appellent|se nomme|se nomment|signifie|représente|représentent)\s((?:l['’]|(?:un|une|le|la|les|des|du|de la)\s).+)$/iu
// "• Le pouvoir législatif (Assemblée nationale, Sénat) qui vote la loi"
const RELATIVE =
  /^((?:l['’]|(?:le|la|les|un|une|des|du)\s)[^,;:(]{1,60}?)\s*(?:\([^)]*\))?\s*,?\s*((?:qui|dont)\s.+)$/iu
// "Photosynthèse : fabrication de matière organique grâce à la lumière"
const COLON = /^([^:,.;()=\d]{2,40}?)\s:\s(.{12,})$/u
const LABEL =
  /^(?:définition|propriété|théorème|rappel|à retenir|remarque|attention|méthode|conclusion)\s*:\s*/iu

const RULES = [
  { pattern: RELATIVE, bulletOnly: true, maxWords: 8 },
  { pattern: IS_A, bulletOnly: false, maxWords: 8 },
  { pattern: COLON, bulletOnly: false, maxWords: 5 },
]

function definitionIn(sentence: string, bullet: boolean) {
  const text = sentence.replace(LABEL, "")
  for (const { pattern, bulletOnly, maxWords } of RULES) {
    if (bulletOnly && !bullet) continue
    const [, term, definition] = pattern.exec(text) ?? []
    if (!term || wordsOf(term).length > maxWords) continue
    return {
      kind: "definition",
      term,
      definition: definition.replace(/[\s.,;]+$/u, ""),
      source: sentence,
    } satisfies DefinitionFact
  }
}

function extractDefinitions(lines: Line[]): DefinitionFact[] {
  const facts: DefinitionFact[] = []
  for (const line of lines) {
    if (line.kind !== "text" && line.kind !== "bullet") continue
    // NOTE: abbreviations such as "etc. Le" split a sentence in two; the
    // pieces then fail to match, which is the safe outcome.
    const sentences = line.text.split(/(?<=[.!?])\s+(?=[A-ZÀÂÇÉÈÊËÎÏÔÙÛÜŒ])/u)
    for (const sentence of sentences) {
      const fact = definitionIn(sentence, line.kind === "bullet")
      if (fact) facts.push(fact)
    }
  }
  return facts
}
