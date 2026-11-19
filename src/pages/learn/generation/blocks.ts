// Says what each line of a normalized course is, so extractors never look at
// raw formatting.

export type Line =
  | { kind: "heading"; text: string; question: boolean }
  | { kind: "bullet"; text: string }
  | { kind: "example"; text: string }
  | { kind: "pairs"; text: string }
  | { kind: "text"; text: string }

// Vocabulary lists put "=", an arrow or a tab between the two sides.
export const PAIR_SEPARATOR = /\s*(?:=|→|↔|->|\t)\s*/u

const NUMBERED = /^(?:[IVX]{1,6}|\d{1,2}|[A-Za-z])[.)]\s+(.+)$/u
const EXAMPLE = /^(?:•\s*)?(?:exemples?|ex\.)\s*:/iu
const QUESTION =
  /^(?:qu['’]|(?:comment|pourquoi|quel(?:le)?s?|que|qui|quand|où|combien|quoi|à quoi|à qui|est-ce)(?![\p{L}]))/iu

// A line is a vocabulary line only if it holds no digit or math sign:
// "1 U.A = 1,5 × 10⁸ km" is a measure, not a word and its translation.
export function isPairLine(text: string) {
  if (/\d|[×÷+²³√<>]/u.test(text)) return false
  const sides = text.split(PAIR_SEPARATOR)
  return (
    sides.length > 1 &&
    sides.every((side) => side !== "" && side.split(/\s+/u).length <= 8)
  )
}

// A line that begins a new element is never the continuation of the previous one.
export function startsNewItem(line: string) {
  return (
    line.startsWith("• ") ||
    NUMBERED.test(line) ||
    EXAMPLE.test(line) ||
    isPairLine(line)
  )
}

function numberedHeading(line: string) {
  const title = NUMBERED.exec(line)?.[1]
  return title && !/[.;,:]$/u.test(title) ? title : undefined
}

function classify(line: string): Line {
  if (EXAMPLE.test(line)) {
    return { kind: "example", text: line.replace(/^•\s*/u, "") }
  }
  if (line.startsWith("• ")) {
    const text = line.slice(2)
    return { kind: isPairLine(text) ? "pairs" : "bullet", text }
  }
  const title = numberedHeading(line)
  if (title)
    return { kind: "heading", text: title, question: title.endsWith("?") }
  // A numbered line that ends like a sentence is a list item, not a title.
  if (NUMBERED.test(line)) return { kind: "bullet", text: line }
  if (QUESTION.test(line) && line.endsWith("?") && line.length <= 140) {
    return { kind: "heading", text: line, question: true }
  }
  return { kind: isPairLine(line) ? "pairs" : "text", text: line }
}

export function classifyLines(text: string): Line[] {
  return text.split("\n").filter(Boolean).map(classify)
}
