#!/usr/bin/env bash
# Scolup quests v3: patches the codebase in place (run it AFTER v2).
#
#   cd path/to/scolup && bash apply-quests-v3.sh
#
# What it does:
#   - Shop: "Couleurs" becomes "Thèmes".
#   - Shop: the Aujourd'hui / Cette semaine / Succès sections become ONE
#     "Quêtes" list (what is left to do first, finished quests last).
#   - Removes the level system (levels, XP bar, "Niveau N" toast). It also
#     drops the stale "xp" value from IndexedDB so it cannot be confused with
#     the real XP that is coming later.
#
# Safety: every edit anchor is checked first. If your copy differs, the script
# stops BEFORE touching anything. Originals are copied to a backup folder in
# your temp directory (path printed at the end).
# Needs: bash, python3. Optional: bun (formats the touched files).
set -euo pipefail

if [ ! -f package.json ] || ! grep -q '"name": "scolup"' package.json; then
  echo "Run this script from the root of the Scolup repository." >&2
  exit 1
fi
if [ ! -f src/services/quest-rules.ts ]; then
  echo "src/services/quest-rules.ts not found: apply apply-quests-v2.sh first." >&2
  exit 1
fi
command -v python3 >/dev/null || { echo "python3 is required." >&2; exit 1; }

BACKUP=$(mktemp -d "${TMPDIR:-/tmp}/scolup-quests-v3-backup.XXXXXX")
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/edits.py" <<'SCOLUP_PY_EOF'
import os, sys

files = {}
touched = []

def load(path):
    if path not in files:
        if not os.path.exists(path):
            sys.exit(f"[scolup-quests-v3] missing file: {path} (run this from the repo root, after apply-quests-v2.sh)")
        with open(path, encoding="utf-8") as f:
            files[path] = f.read()
    return files[path]

def edit(path, old, new):
    s = load(path)
    n = s.count(old)
    if n != 1:
        sys.exit(
            f"[scolup-quests-v3] cannot patch {path}: expected 1 match, found {n} for:\n---\n{old}\n---\n"
            "Your copy differs from the one this script was written for. Nothing was changed."
        )
    files[path] = s.replace(old, new)
    if path not in touched:
        touched.append(path)

# ------------------------------------------------------------- 1. no levels
# quest-rules.ts: the toast no longer carries a level
edit("src/services/quest-rules.ts",
'''export interface QuestToast {
  quests: QuestDef[]
  level: number | null // set when this reward made the player level up
}

export function toastText({ quests, level }: QuestToast): string {
  const total = quests.reduce((sum, quest) => sum + quest.reward, 0)
  const levelUp = level === null ? "" : `Niveau ${level} !`
  if (quests.length === 0) return levelUp
  const head =
    quests.length === 1
      ? `Quête accomplie : ${quests[0].title} (+${total} rubis)`
      : `${quests.length} quêtes accomplies (+${total} rubis)`
  return levelUp ? `${head} · ${levelUp}` : head
}''',
'''export interface QuestToast {
  quests: QuestDef[]
}

export function toastText({ quests }: QuestToast): string {
  const total = quests.reduce((sum, quest) => sum + quest.reward, 0)
  return quests.length === 1
    ? `Quête accomplie : ${quests[0].title} (+${total} rubis)`
    : `${quests.length} quêtes accomplies (+${total} rubis)`
}''')

# quests.ts: no XP, no level
Q = "src/services/quests.ts"
edit(Q,
'''import {
  addToWeek,
  levelFromXp,
  parseWeeks,
  WEEKS_KEY,
  XP_KEY,
} from "./shop-rules"''',
'import { addToWeek, parseWeeks, WEEKS_KEY } from "./shop-rules"')
edit(Q, '// Progress, rubies, XP and the weekly recap are written in ONE IndexedDB',
        '// Progress, rubies and the weekly recap are written in ONE IndexedDB')
edit(Q, '    let level: number | null = null\n', '')
edit(Q,
'''      const [balanceRaw, xpRaw, weeksRaw] = await Promise.all([
        shop.get(RUBIES_KEY),
        shop.get(XP_KEY),
        shop.get(WEEKS_KEY),
      ])
      const balance = toNumber(balanceRaw)
      // Players from before levels existed start with what they already own.
      const xp = toNumber(xpRaw, balance)
''',
'''      const [balanceRaw, weeksRaw] = await Promise.all([
        shop.get(RUBIES_KEY),
        shop.get(WEEKS_KEY),
      ])
      const balance = toNumber(balanceRaw)
''')
edit(Q, '      await shop.put(xp + reward, XP_KEY)\n', '')
edit(Q,
'''      const after = levelFromXp(xp + reward).level
      if (after > levelFromXp(xp).level) level = after
''', '')
edit(Q,
'''      if (loud.length > 0 || level !== null) {
        for (const l of toastListeners) l({ quests: loud, level })
      }''',
'''      if (loud.length > 0) {
        for (const l of toastListeners) l({ quests: loud })
      }''')

# shop.ts: no xp (and drop the stale value once, so it can't be mistaken for
# the real XP that will come later)
S = "src/services/shop.ts"
edit(S, '  WEEKS_KEY,\n  XP_KEY,\n  type PurchaseStatus,', '  WEEKS_KEY,\n  type PurchaseStatus,')
edit(S, '  owned: string[]\n  xp: number\n  weeks: WeekStats', '  owned: string[]\n  weeks: WeekStats')
edit(S, 'export const EMPTY_SHOP: ShopState = { owned: [], xp: 0, weeks: {} }',
'''export const EMPTY_SHOP: ShopState = { owned: [], weeks: {} }

// ponytail: "xp" used to hold lifetime rubies for the removed level system.
// Real XP is coming: delete the stale value once so nobody mistakes it for the
// new one. Remove this after a few releases.
let staleXpDropped = false''')
edit(S,
'''    const [ownedRaw, xpRaw, weeksRaw, balanceRaw] = await Promise.all([
      db.get("shop", OWNED_KEY),
      db.get("shop", XP_KEY),
      db.get("shop", WEEKS_KEY),
      db.get("shop", RUBIES_KEY),
    ])
    const balance = typeof balanceRaw === "number" ? balanceRaw : 0
    return {
      owned: parseOwned(ownedRaw),
      // Players from before levels existed start with what they already own.
      xp: typeof xpRaw === "number" ? xpRaw : balance,
      weeks: parseWeeks(weeksRaw),
    }''',
'''    if (!staleXpDropped) {
      staleXpDropped = true
      await db.delete("shop", "xp")
    }
    const [ownedRaw, weeksRaw] = await Promise.all([
      db.get("shop", OWNED_KEY),
      db.get("shop", WEEKS_KEY),
    ])
    return {
      owned: parseOwned(ownedRaw),
      weeks: parseWeeks(weeksRaw),
    }''')

# shop-rules.ts: no level maths
R = "src/services/shop-rules.ts"
edit(R, '// Pure shop logic: catalog, levels, weekly recap.', '// Pure shop logic: catalog, purchases, weekly recap.')
edit(R, 'export const XP_KEY = "xp"\n', '')
edit(R,
'''// ---- Levels ----------------------------------------------------------------
// XP = every ruby ever earned (spending rubies never lowers your level).
// Level n starts at 50 * n * (n - 1) XP: 100, 300, 600, 1000...

export interface LevelInfo {
  level: number
  progress: number // 0..1 toward the next level
  toNext: number // XP missing for the next level
}

export function levelFromXp(xp: number): LevelInfo {
  const safe = Math.max(0, Math.trunc(xp))
  let level = 1
  while (safe >= 50 * (level + 1) * level) level++
  const start = 50 * level * (level - 1)
  const size = 100 * level
  return {
    level,
    progress: (safe - start) / size,
    toNext: start + size - safe,
  }
}

''', '')
edit("src/hooks/use-shop.ts", '// Inventory, XP and weekly recap.', '// Inventory and weekly recap.')

# tests
edit("tests/quests.test.ts",
'''    expect(toastText({ quests: [once], level: null })).toBe(
      "Quête accomplie : A (+10 rubis)"
    )
    expect(toastText({ quests: [once, weekly], level: 3 })).toBe(
      "2 quêtes accomplies (+30 rubis) · Niveau 3 !"
    )
    expect(toastText({ quests: [], level: 2 })).toBe("Niveau 2 !")''',
'''    expect(toastText({ quests: [once] })).toBe(
      "Quête accomplie : A (+10 rubis)"
    )
    expect(toastText({ quests: [once, weekly] })).toBe(
      "2 quêtes accomplies (+30 rubis)"
    )''')
edit("tests/shop-rules.test.ts", '  addToWeek,\n  levelFromXp,\n', '  addToWeek,\n')
edit("tests/shop-rules.test.ts",
'''describe("levels", () => {
  test("thresholds", () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(299).level).toBe(2)
    expect(levelFromXp(300).level).toBe(3)
    expect(levelFromXp(600).level).toBe(4)
  })
  test("progress and toNext", () => {
    const info = levelFromXp(150)
    expect(info.level).toBe(2)
    expect(info.toNext).toBe(150)
    expect(info.progress).toBeCloseTo(0.25)
  })
  test("garbage in, level 1 out", () => {
    expect(levelFromXp(-5).level).toBe(1)
  })
})

''', '')

# ---------------------------------------------------------- UI: shop screen
H = "src/pages/shop/components/ShopHeader.tsx"
edit(H,
'''export function ShopHeader({
  rubies,
  level,
  progress,
  toNext,
  weekText,
}: {
  rubies: number
  level: number
  progress: number // 0..1
  toNext: number
  weekText: string | null
}) {''',
'''export function ShopHeader({
  rubies,
  weekText,
}: {
  rubies: number
  weekText: string | null
}) {''')
edit(H,
'''
      <div className="mt-2 flex w-full max-w-xs flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-foreground">Niveau {level}</span>
          <span className="text-muted-foreground tabular-nums">
            encore {toNext} pour le niveau {level + 1}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Niveau ${level}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
''', '')

P = "src/pages/shop/ShopPage.tsx"
edit(P, 'import type { QuestPeriod } from "@/services/quest-rules"\n', '')
edit(P,
'''const QUEST_SECTIONS: { period: QuestPeriod; title: string }[] = [
  { period: "daily", title: "Aujourd'hui" },
  { period: "weekly", title: "Cette semaine" },
  { period: "once", title: "Succès" },
]

''', '')
edit(P,
'''        <ShopHeader
          rubies={page.rubies}
          level={page.level.level}
          progress={page.level.progress}
          toNext={page.level.toNext}
          weekText={page.weekText}
        />''',
'''        <ShopHeader rubies={page.rubies} weekText={page.weekText} />''')
edit(P,
'''        {QUEST_SECTIONS.map(({ period, title }) => {
          const list = page.questsFor(period)
          if (list.length === 0) return null
          return (
            <div key={period} className="flex flex-col gap-2 px-4 pb-6">
              <h2 className="text-base font-semibold">{title}</h2>
              <div className="flex flex-col gap-2">
                {list.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>
          )
        })}''',
'''        {page.quests.length > 0 && (
          <div className="flex flex-col gap-2 px-4 pb-6">
            <h2 className="text-base font-semibold">Quêtes</h2>
            <div className="flex flex-col gap-2">
              {page.quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          </div>
        )}''')
edit(P, '<h2 className="text-base font-semibold">Couleurs</h2>',
        '<h2 className="text-base font-semibold">Thèmes</h2>')

U = "src/pages/shop/hooks/useShopPage.ts"
edit(U, '  levelFromXp,\n  SHOP_ITEMS,', '  SHOP_ITEMS,')
edit(U, '  const level = useMemo(() => levelFromXp(shop.xp), [shop.xp])\n',
'''  // One list: what is still to do first (daily, then weekly, then
  // achievements), what is done last.
  const sortedQuests = useMemo(
    () =>
      [...quests].sort(
        (a, b) =>
          Number(a.state === "achieved") - Number(b.state === "achieved") ||
          PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]
      ),
    [quests]
  )
''')
edit(U, 'interface Notice {',
'''const PERIOD_ORDER: Record<QuestPeriod, number> = {
  daily: 0,
  weekly: 1,
  once: 2,
}

interface Notice {''')
edit(U, '`${item.label} débloquée !`', '`Thème ${item.label} débloqué !`')
edit(U,
'''  const questsFor = (period: QuestPeriod) =>
    quests.filter((quest) => quest.period === period)

''', '')
edit(U, '    rubies,\n    level,\n    weekText,', '    rubies,\n    quests: sortedQuests,\n    weekText,')
edit(U, '    use,\n    questsFor,\n  }', '    use,\n  }')

I = "src/pages/shop/components/ShopItemCard.tsx"
edit(I, 'Couleur {item.label}</div>', 'Thème {item.label}</div>')
edit(I, '? "Couleur utilisée"\n              : "Débloquée"', '? "Thème utilisé"\n              : "Débloqué"')
edit(I, ': "Prête à débloquer"', ': "Prêt à débloquer"')

for path, content in files.items():
    if os.environ.get("SCOLUP_BACKUP"):
        import shutil
        dest = os.path.join(os.environ["SCOLUP_BACKUP"], path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(path, dest)
for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
with open(os.environ["SCOLUP_TOUCHED"], "w") as f:
    f.write("\n".join(touched) + "\n")
print(f"[scolup-quests-v3] patched {len(touched)} files")
SCOLUP_PY_EOF

SCOLUP_BACKUP="$BACKUP" SCOLUP_TOUCHED="$WORK/touched.txt" python3 "$WORK/edits.py"

if command -v bun >/dev/null && [ -d node_modules ]; then
  # shellcheck disable=SC2046
  bun x oxfmt --write $(cat "$WORK/touched.txt") >/dev/null 2>&1 \
    || echo "(formatting skipped: run bun run format yourself)"
fi

echo
echo "Done. Next:"
echo "  bun test && bun run precommit"
echo "  (original files saved in: $BACKUP)"
