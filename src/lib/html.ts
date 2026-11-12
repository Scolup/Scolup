const namedEntities: Record<string, string> = {
  quot: '"',
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: "\u00a0",
  iexcl: "¡",
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  brvbar: "¦",
  sect: "§",
  uml: "¨",
  copy: "©",
  ordf: "ª",
  laquo: "«",
  not: "¬",
  shy: "\u00ad",
  reg: "®",
  macr: "¯",
  deg: "°",
  plusmn: "±",
  sup2: "²",
  sup3: "³",
  acute: "´",
  micro: "µ",
  para: "¶",
  middot: "·",
  cedil: "¸",
  sup1: "¹",
  ordm: "º",
  raquo: "»",
  frac14: "¼",
  frac12: "½",
  frac34: "¾",
  iquest: "¿",
  Agrave: "À",
  Aacute: "Á",
  Acirc: "Â",
  Atilde: "Ã",
  Auml: "Ä",
  Aring: "Å",
  AElig: "Æ",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Igrave: "Ì",
  Iacute: "Í",
  Icirc: "Î",
  Iuml: "Ï",
  ETH: "Ð",
  Ntilde: "Ñ",
  Ograve: "Ò",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Ouml: "Ö",
  times: "×",
  Oslash: "Ø",
  Ugrave: "Ù",
  Uacute: "Ú",
  Ucirc: "Û",
  Uuml: "Ü",
  Yacute: "Ý",
  THORN: "Þ",
  szlig: "ß",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  aelig: "æ",
  ccedil: "ç",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  eth: "ð",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  divide: "÷",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  thorn: "þ",
  yuml: "ÿ",
  OElig: "Œ",
  oelig: "œ",
  Scaron: "Š",
  scaron: "š",
  Yuml: "Ÿ",
  fnof: "ƒ",
  circ: "ˆ",
  tilde: "˜",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  dagger: "†",
  Dagger: "‡",
  permil: "‰",
  lsaquo: "‹",
  rsaquo: "›",
  euro: "€",
}

// Mappage Windows-1252 des références numériques 128-159 (comme les
// navigateurs) : 128 donne € et 146 ', pas des contrôles invisibles.
const win1252: Record<number, string> = {
  128: "€",
  130: "‚",
  131: "ƒ",
  132: "„",
  133: "…",
  134: "†",
  135: "‡",
  136: "ˆ",
  137: "‰",
  138: "Š",
  139: "‹",
  140: "Œ",
  142: "Ž",
  145: "‘",
  146: "’",
  147: "“",
  148: "”",
  149: "•",
  150: "–",
  151: "—",
  152: "˜",
  153: "™",
  154: "š",
  155: "›",
  156: "œ",
  158: "ž",
  159: "Ÿ",
}

function decodeOnce(text: string): string {
  return text.replace(
    /&#(\d+);|&#x([0-9a-fA-F]+);|&([a-zA-Z]+);/g,
    (entity, dec?: string, hex?: string, name?: string) => {
      if (dec !== undefined) {
        const code = Number(dec)
        if (code >= 128 && code <= 159) {
          return win1252[code] ?? String.fromCodePoint(code)
        }
        try {
          return String.fromCodePoint(code)
        } catch {
          return "�"
        }
      }
      if (hex !== undefined) {
        try {
          return String.fromCodePoint(Number.parseInt(hex, 16))
        } catch {
          return "�"
        }
      }
      return namedEntities[name ?? ""] ?? entity
    }
  )
}

export function decodeHtmlEntities(text: string): string {
  let current = text
  for (let i = 0; i < 3; i++) {
    const next = decodeOnce(current)
    if (next === current) return next
    current = next
  }
  return current
}

export function htmlToText(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h\d|li|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
  return decodeHtmlEntities(text).trim()
}

// ---- Assainissement -------------------------------------------------------
// Le HTML des devoirs, messages, cours et post-its vient de l'ENT : on ne le
// place jamais tel quel dans la page. Liste blanche de balises, d'attributs et
// de propriétés de style ; le reste est retiré (balises dangereuses) ou
// « déballé » (balises inconnues : on garde leur texte). Le document analysé
// par DOMParser est inerte : rien ne s'exécute ni ne se charge pendant le tri.

const ALLOWED_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "col",
  "colgroup",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
])

// Retirées avec tout leur contenu (jamais déballées).
const DROPPED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "svg",
  "math",
  "template",
  "noscript",
  "audio",
  "video",
  "source",
  "track",
  "canvas",
  "dialog",
])

const TAG_ATTRIBUTES: Record<string, string[]> = {
  a: ["href"],
  img: ["src", "alt", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  col: ["span"],
  colgroup: ["span"],
  ol: ["start"],
}

// Mise en forme que l'ENT utilise vraiment (couleurs, gras...), sans rien de
// ce qui positionne ou charge une ressource.
const ALLOWED_STYLE_PROPERTIES = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
])
const SAFE_STYLE_VALUE = /^[#\w\s.,%()-]+$/
const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i

// Uniquement des adresses absolues : une adresse relative n'a pas de sens ici
// (l'ENT n'est pas l'origine de l'app) et `javascript:` est refusé d'office.
function safeUrl(value: string, protocols: readonly string[]): string | null {
  const trimmed = value.trim()
  try {
    return protocols.includes(new URL(trimmed).protocol) ? trimmed : null
  } catch {
    return null
  }
}

function cleanStyle(element: Element): void {
  const style = element.getAttribute("style")
  if (style === null) return
  const kept: string[] = []
  for (const declaration of style.split(";")) {
    const separator = declaration.indexOf(":")
    if (separator === -1) continue
    const property = declaration.slice(0, separator).trim().toLowerCase()
    const value = declaration.slice(separator + 1).trim()
    if (
      ALLOWED_STYLE_PROPERTIES.has(property) &&
      SAFE_STYLE_VALUE.test(value) &&
      !/url|expression|javascript/i.test(value)
    ) {
      kept.push(`${property}: ${value}`)
    }
  }
  if (kept.length > 0) element.setAttribute("style", kept.join("; "))
  else element.removeAttribute("style")
}

function cleanAttributes(element: Element, tag: string): void {
  const allowed = TAG_ATTRIBUTES[tag] ?? []
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase()
    if (name === "style" || name === "title" || allowed.includes(name)) continue
    element.removeAttribute(attribute.name)
  }
  cleanStyle(element)

  if (tag === "a") {
    const href = element.getAttribute("href")
    const safe =
      href === null
        ? null
        : safeUrl(href, ["http:", "https:", "mailto:", "tel:"])
    if (safe === null) {
      element.removeAttribute("href")
    } else {
      element.setAttribute("href", safe)
      element.setAttribute("target", "_blank")
      element.setAttribute("rel", "noopener noreferrer")
    }
  }

  if (tag === "img") {
    const src = element.getAttribute("src")
    const safe =
      src === null
        ? null
        : DATA_IMAGE.test(src.trim())
          ? src.trim()
          : safeUrl(src, ["http:", "https:"])
    if (safe === null) element.remove()
    else element.setAttribute("src", safe)
  }
}

function cleanChildren(parent: Node): void {
  for (const child of Array.from(parent.childNodes)) {
    // 3 = texte, 1 = élément ; commentaires et le reste partent.
    if (child.nodeType === 3) continue
    if (child.nodeType !== 1) {
      parent.removeChild(child)
      continue
    }
    const element = child as Element
    const tag = element.tagName.toLowerCase()
    if (DROPPED_TAGS.has(tag)) {
      element.remove()
      continue
    }
    cleanChildren(element)
    if (ALLOWED_TAGS.has(tag)) cleanAttributes(element, tag)
    else element.replaceWith(...Array.from(element.childNodes))
  }
}

export function sanitizeHtml(html: string): string {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  cleanChildren(doc.body)
  return doc.body.innerHTML
}
