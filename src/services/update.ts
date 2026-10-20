import { getSetting, setSetting } from "./storage"

const RELEASES_URL =
  "https://api.github.com/repos/Scolup/Scolup/releases/latest"
const CACHE_KEY = "update-check"
const CACHE_TTL_MS = 60_000

export interface LatestRelease {
  tag: string
  name: string
  body: string
  url: string
}

export type InlineToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }

export type ReleaseNoteBlock =
  | { type: "heading"; tokens: InlineToken[] }
  | { type: "bullet"; tokens: InlineToken[] }
  | { type: "paragraph"; tokens: InlineToken[] }

interface ParsedVersion {
  core: number[]
  suffix: string
}

interface CacheEntry {
  checkedAt: number
  release: LatestRelease | null
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function parseVersion(version: string): ParsedVersion {
  const match = version
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+(?:\.\d+)*)(.*)$/)
  if (!match) return { core: [], suffix: version.trim() }
  return {
    core: match[1].split(".").map(Number),
    suffix: match[2].replace(/^[-.]/, ""),
  }
}

function compareSuffixes(a: string, b: string): number {
  const ma = a.match(/^([a-z]+)(\d*)$/i)
  const mb = b.match(/^([a-z]+)(\d*)$/i)
  if (ma && mb) {
    const kindA = ma[1].toLowerCase()
    const kindB = mb[1].toLowerCase()
    if (kindA !== kindB) return kindA < kindB ? -1 : 1
    const na = Number(ma[2] || 0)
    const nb = Number(mb[2] || 0)
    return na === nb ? 0 : na < nb ? -1 : 1
  }
  return a < b ? -1 : 1
}

export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  const length = Math.max(va.core.length, vb.core.length)
  for (let i = 0; i < length; i++) {
    const diff = (va.core[i] ?? 0) - (vb.core[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  if (va.suffix === vb.suffix) return 0
  if (!va.suffix) return 1
  if (!vb.suffix) return -1
  return compareSuffixes(va.suffix, vb.suffix)
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ type: "text", text: text.slice(lastIndex, index) })
    }
    const raw = match[0]
    if (raw.startsWith("**")) {
      tokens.push({ type: "bold", text: raw.slice(2, -2) })
    } else if (raw.startsWith("`")) {
      tokens.push({ type: "code", text: raw.slice(1, -1) })
    } else {
      const link = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link && /^https?:\/\//i.test(link[2])) {
        tokens.push({ type: "link", text: link[1], href: link[2] })
      } else {
        tokens.push({ type: "text", text: raw })
      }
    }
    lastIndex = index + raw.length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", text: text.slice(lastIndex) })
  }
  return tokens
}

export function parseReleaseNotes(body: string): ReleaseNoteBlock[] {
  const blocks: ReleaseNoteBlock[] = []
  let paragraph: string[] = []

  function flushParagraph() {
    if (paragraph.length === 0) return
    blocks.push({ type: "paragraph", tokens: parseInline(paragraph.join(" ")) })
    paragraph = []
  }

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("```") || /^[-*_]{3,}$/.test(line)) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      flushParagraph()
      blocks.push({ type: "heading", tokens: parseInline(heading[1]) })
      continue
    }

    const bullet = line.match(/^[-*+]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      blocks.push({ type: "bullet", tokens: parseInline(bullet[1]) })
      continue
    }

    paragraph.push(line.replace(/^>\s?/, ""))
  }

  flushParagraph()
  return blocks
}

function isLatestRelease(value: unknown): value is LatestRelease {
  if (!value || typeof value !== "object") return false
  const release = value as Record<string, unknown>
  return (
    typeof release.tag === "string" &&
    typeof release.name === "string" &&
    typeof release.body === "string" &&
    typeof release.url === "string"
  )
}

function parseCache(value: string | boolean | undefined): CacheEntry | null {
  if (typeof value !== "string") return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object") return null
    const entry = parsed as Record<string, unknown>
    if (typeof entry.checkedAt !== "number") return null
    return {
      checkedAt: entry.checkedAt,
      release: isLatestRelease(entry.release) ? entry.release : null,
    }
  } catch {
    return null
  }
}

async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const response = await fetch(RELEASES_URL, {
    headers: { Accept: "application/vnd.github+json" },
  })
  if (!response.ok) throw new Error(`GitHub releases: ${response.status}`)

  const data: unknown = await response.json()
  if (!data || typeof data !== "object") return null
  const release = data as Record<string, unknown>
  if (typeof release.tag_name !== "string") return null

  const name =
    typeof release.name === "string" && release.name
      ? release.name
      : release.tag_name
  return {
    tag: release.tag_name,
    name,
    body: typeof release.body === "string" ? release.body : "",
    url: typeof release.html_url === "string" ? release.html_url : "",
  }
}

async function fetchCachedRelease(): Promise<LatestRelease | null> {
  const cached = parseCache(await getSetting(CACHE_KEY))
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.release
  }

  const release = await fetchLatestRelease()
  const entry: CacheEntry = { checkedAt: Date.now(), release }
  await setSetting(CACHE_KEY, JSON.stringify(entry))
  return release
}

function currentVersion(): string {
  return typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : ""
}

export async function checkForUpdate(): Promise<LatestRelease | null> {
  const release = await fetchCachedRelease()
  if (!release) return null
  // Any difference between the running version and the released one means
  // the app is out of date, whether it is behind or ahead of the release.
  return compareVersions(release.tag, currentVersion()) !== 0 ? release : null
}
