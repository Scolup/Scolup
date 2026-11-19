// Repairs what copy-pasting a PDF or Word file does to a course, before any
// fact is extracted. Rules only fix what they can prove; anything doubtful is
// left as it is.

import { isPairLine, startsNewItem } from "./blocks"

// Bullets come in many glyphs. Wingdings ones land in the private-use area.
const BULLET = /^(?:[•·▪▫◦●○■□‣⁃∙]|[*−–—-](?=\s)|[\uE000-\uF8FF])\s*/u
const SENTENCE_END = /[.!?:;…]$/u
// A line ending on one of these words cannot be the end of a sentence.
const CONNECTORS = new Set([
  ...["de", "du", "des", "la", "le", "les", "l", "d", "un", "une", "et", "ou"],
  ...["à", "au", "aux", "en", "dans", "sur", "par", "pour", "avec", "que"],
  ...["qui", "the", "of", "and", "to", "an"],
])

function lastWord(line: string) {
  return /([\p{L}]+)['’]?$/u.exec(line)?.[1]?.toLowerCase() ?? ""
}

// PDF lines are cut by the page width, not by the sentence.
function shouldJoin(current: string, next: string) {
  if (
    SENTENCE_END.test(current) ||
    isPairLine(current) ||
    startsNewItem(next)
  ) {
    return false
  }
  return (
    /^[\p{Ll}(]/u.test(next) ||
    current.endsWith(",") ||
    CONNECTORS.has(lastWord(current))
  )
}

function joinWrappedLines(lines: string[]) {
  const result: string[] = []
  for (const line of lines) {
    const previous = result.at(-1)
    if (previous && line && shouldJoin(previous, line)) {
      result[result.length - 1] = `${previous} ${line}`
    } else {
      result.push(line)
    }
  }
  return result.filter(Boolean)
}

// Superscripts are lost when copying: "1,5 × 10⁸" becomes "1,5 x 108". Both
// readings are possible ("3 x 105" can be a plain product), so a power is only
// restored when the same line gives the amount in words ("150 millions").
const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹"
const WORD_AMOUNT = /(\d+(?: \d{3})*(?:[.,]\d+)?)\s*(millions?|milliards?)/giu
const FLATTENED_POWER = /(\d+(?:[.,]\d+)?)\s*[x×X*]\s*10(\d{1,2})(?!\d)/gu
const FLATTENED_ORDER = /(?<![\p{L}])(environ|≈|~)\s*10(\d{2})(?!\d)/giu

const superscript = (digits: string) =>
  [...digits].map((digit) => SUPERSCRIPTS[Number(digit)]).join("")
const toNumber = (text: string) =>
  Number(text.replaceAll(" ", "").replace(",", "."))

function amountsInWords(line: string) {
  return [...line.matchAll(WORD_AMOUNT)].map(
    ([, number, unit]) =>
      toNumber(number) * (unit.toLowerCase().startsWith("milliard") ? 1e9 : 1e6)
  )
}

function repairExponents(line: string) {
  const amounts = amountsInWords(line)
  if (!amounts.length) return line
  return line
    .replace(FLATTENED_POWER, (match, mantissa: string, exponent: string) => {
      const value = toNumber(mantissa) * 10 ** Number(exponent)
      const confirmed = amounts.some(
        (amount) => Math.abs(amount - value) <= amount * 0.01
      )
      return confirmed && !/^0+$/u.test(exponent)
        ? `${mantissa} × 10${superscript(exponent)}`
        : match
    })
    .replace(FLATTENED_ORDER, (match, word: string, digits: string) => {
      // "environ 1013" is 10¹³ only if it is far from the literal 1013 and
      // within a factor ten of an amount given in words.
      const literal = Math.log10(Number(`10${digits}`))
      const close = amounts.some(
        (amount) => Math.abs(Math.log10(amount) - Number(digits)) < 1
      )
      const far = amounts.every(
        (amount) => Math.abs(Math.log10(amount) - literal) > 3
      )
      return close && far ? `${word} 10${superscript(digits)}` : match
    })
}

function cleanLine(line: string) {
  const text = line.replace(/ {2,}/gu, " ").trim()
  if (!BULLET.test(text)) return text
  const rest = text.replace(BULLET, "")
  return rest && `• ${rest}`
}

export function normalizeText(raw: string) {
  const lines = raw
    .normalize("NFC")
    .replace(/[\u00A0\u202F\u2009]/gu, " ")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/gu, "")
    .split(/\r\n|\r|\n/u)
    .map(cleanLine)
  return joinWrappedLines(lines).map(repairExponents).join("\n")
}
