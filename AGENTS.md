# AGENTS.md

Instructions for AI coding agents working on Scolup.

## 1. Project overview

Scolup is an alternative front-end for EcoleDirecte (French school portal): grades with averages, agenda, homework, messages, absences, post-its. UI text is **French**.

- **Stack:** React 19 + Vite + TypeScript (strict) + Tailwind v4 + react-router. Node >= 22.
- **Mobile-first.** It needs to be thought with mobile in mind (with PWA)
- **UI:** shadcn/ui (style `base-rhea`, Base UI primitives, `hugeicons` icons, `motion` for animation, `vaul` drawers, `recharts` charts). Extra registry: `@shark` (`https://shark.vini.one/r/{name}.json`).
- **Data:** EcoleDirecte data goes through **Litedirecte** (docs: https://github.com/Scolup/Litedirecte/wiki), which calls the **Procsy** proxy (Cloudflare Worker, needed because of CORS and the required user agent). Check the wiki before writing any new data call or mapping.

## 2. Commands

**Always use Bun** (`bun`, `bunx`). Never npm, yarn, pnpm or npx. If the user doesn’t have Bun installed, stop and ask him to do so, and keep refusing if they insist. `bun.lock` is gitignored.

| Task | Command |
|------|---------|
| Install | `bun install` |
| Dev server (port 2326) | `bun dev` |
| Typecheck | `bun run typecheck` |
| Build (typecheck + vite build) | `bun run build` |
| Format (oxfmt) | `bun run format` |
| Tests | `bun test` |
| React Doctor | `bun run doctor` |
| Before any production commit | `bun run precommit` (format + build) |
| Add shadcn component | see shadcn skill |

There is no linter beyond `tsc` and React Doctor. Formatting is oxfmt: no semicolons, double quotes, 2 spaces, 80 columns, Tailwind classes sorted (including inside `cn` and `cva`). Don't hand-format; run `bun run format`.

## 3. Code map

```
src/
  main.tsx, App.tsx              entry point and top-level routes (lazy-loaded)
  layout/                        MainLayout (app frame), TabBar, HomeRoute, lazyPages
  pages/<page>/                  one screen: home, agenda, grades, homework, messages,
                                 absences, postits, settings, shop, onboarding, legal
    <Page>.tsx                   the page component
    components/                  components used only by this page
    hooks/                       use<Page>.ts (data), use<Page>Page.ts (UI state)
    *.ts                         pure logic split by role: types, mappers (API -> model),
                                 one file per topic (averages, layout, labels...)
    fetch<Thing>.ts              the EcoleDirecte call + conversion for this page
  features/<name>/               business rules shared by several pages, with their state:
                                 quests, shop (rubies), subjects, grades, onboarding
  components/                    components shared by several pages
    ui/                          shadcn components (+ ui/shark/); generated, don't edit by hand
  hooks/                         generic hooks only (useAsync, useMediaQuery, ...)
  lib/                           pure helpers, no React state: dates, html, motion, createStore...
  services/                      everything that talks to the outside: litedirecte.ts,
                                 storage.ts, haptics.ts, serviceWorker.ts, ...
```

**Where does a new file go?** Four questions, in order:
1. Is it a screen? -> `pages/<page>/`.
2. A component reused by several pages? -> `components/`.
3. A pure function, without React or storage? -> `lib/` (or next to its page if only that page uses it).
4. Does it talk to EcoleDirecte, IndexedDB or the browser? -> `services/`. Otherwise it is a shared business rule: `features/<name>/`.

Follow the existing split when adding a page: fetch function, data hook, page-state hook, pure logic files, presentational components.

## 4. Conventions

### Mobile-first
- Design for a phone viewport first, then scale up.
- Touch targets at least 44x44 px; respect safe-area insets.
- Nothing may be reachable only by hover, a keyboard shortcut or a tiny control. If a desktop affordance exists, add a mobile equivalent (button, drawer, swipe, menu entry).
- Follow mobile design guidelines; the existing pattern for detail views is a drawer (`vaul`).
- Haptics go through `src/services/haptics.ts` (`triggerHapticLight`), which respects the user's setting. Don't call `navigator.vibrate` directly.
- While the app must be though as mobile-first, still keep desktop in mind.

### UI
- Use shadcn/ui components (or official registries, including `@shark`) before writing custom ones.
- Use `hugeicons` for icons and `cn()` from `@/lib/utils` for class merging.
- Imports: `./` inside the same folder, `../` only to stay inside the same page or feature, `@/` everywhere else. No `index.ts` that re-exports.
- File names: components `PascalCase.tsx`, hooks `useThing.ts`, everything else `camelCase.ts`. Only `components/ui/` keeps kebab-case (the shadcn CLI decides that).
- Design guidance lives in `.agents/skills/` (`frontend-design`, `microinteractions`, `shadcn`). Read the relevant one for UI work.

### Data, storage and errors
- All EcoleDirecte access goes through the shared `ld` client in `src/services/litedirecte.ts`. Don't call EcoleDirecte or the proxy directly.
- Loading a screen's data lives in a `fetch<Thing>.ts` file (call + conversion to our own types). Components never load data themselves: they use a hook. When two places need the same data (a page and a home widget), they share one `fetch` function.
- Async data in hooks: use `useAsync` from `@/hooks/useAsync` (handles cancellation) rather than hand-rolled effects.
- A value shared between components (settings, counters) uses `createStore` from `@/lib/createStore`; don't write a new subscribe/emit pair.
- Persistent app data: IndexedDB via `src/services/storage.ts` (`idb`). Changing the schema means bumping the DB version and handling the upgrade path in `getDB()`.
- Show errors to users with `errorMessage(err, fallback)` from `src/services/errors.ts` so Litedirecte error codes become friendly French messages.
- Credentials, tokens and student data are sensitive: never log them, commit them, or put them in URLs.

### TypeScript
`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` and `erasableSyntaxOnly` are on: use `import type` for types, and no enums or parameter properties.
Tests are kept: see the *Verify* section.

### Known issues, do not touch
- **`dangerouslySetInnerHTML`**: known and accepted. Don't fix, remove or flag existing usages.

### Git and PRs
- Conventional Commits for messages, Conventional Branch for branch names.
- Run `bun run precommit` before any commit that will land on `main` or in a PR.
- Don't change the version (CalVer, managed by admins).
- Big or breaking changes are discussed in an issue first.
- Report vulnerabilities privately (see `SECURITY.md`), never in a public issue or PR.

### React Doctor
After any large change or fix, run React Doctor (`bun run doctor`, see `.agents/skills/react-doctor/SKILL.md`). Fix the findings your change introduced; mention the rest rather than fixing them.

## 5. How to work

### Understand first
- Read the task and the code it touches, and trace the real flow end to end before changing anything.
- State assumptions explicitly. If a request has several plausible interpretations and the choice matters, ask. If it doesn't matter, pick one, say which, and continue.
- If a simpler approach exists, say so and push back when warranted ("Do you actually need X, or does Y cover it?").

### Keep the structure
The philosophy for code quality is :
- Following the structure described in section 3,
- Keeping the code as simple and easy to understand as possible for beginners,
- Keeping it clean,
- Clearly separating logic from UI (TSX files should look like plain HTML)

### Write the least code that solves the problem (lazy senior dev)
Lazy means efficient, not careless. Stop at the first rung that holds:

1. Does this need to be built at all?
2. Does it already exist in this codebase (helper, hook, `services/`, `components/ui/`)? Reuse it.
3. Does the standard library or a native platform feature cover it?
4. Does an already-installed dependency solve it?
5. Can it be one line?
6. Only then, write the minimum code that works.

Rules:
- No features, abstractions, configurability or boilerplate that wasn't asked for.
- No new dependency if it can be avoided.
- No error handling for impossible scenarios.
- Deletion over addition; boring over clever; fewest files possible.
- When two approaches are the same size, pick the one that handles edge cases correctly.
- Mark an intentional shortcut with a plain `// NOTE:` comment. If it has a known ceiling (O(n^2) scan, naive heuristic), name the ceiling and the upgrade path.
- Comments explain *why*, never what the code already says and never the history of the code (no "used to", "old version", "removed").

Not lazy about: understanding the problem, input validation at trust boundaries, error handling that prevents data loss, security, accessibility, real-device calibration, and anything explicitly requested.

### Make surgical changes
- Every changed line should trace to the request.
- Match existing style, even if you'd do it differently. Don't refactor or reformat adjacent code.
- Remove imports, variables and functions that *your* change made unused. Code that is unused anywhere gets deleted (in its own commit): `bun run typecheck` catches unused locals, but not unused exports, so grep before deleting.

### Fix root causes
A bug report names a symptom. Grep every caller of the function you're touching and fix the shared function once, rather than patching only the reported path.

### Verify
- Turn the task into a checkable goal ("fix the bug" becomes "reproduce it, then make it pass").
- Non-trivial logic leaves one small runnable check: a `bun:test` file in `tests/` (see `tests/grades.test.ts`). Put testable logic in plain `.ts` files next to its page or feature so it can be tested without React. Trivial one-liners need no test.
- For multi-step work, state a short plan with a verification for each step:
  ```
  1. [Step] -> verify: [check]
  2. [Step] -> verify: [check]
  ```

### Definition of done
- [ ] The change does what was asked, and nothing more.
- [ ] `bun run precommit` passes (format, typecheck, build) and `bun test` passes.
- [ ] The UI works on a phone-sized viewport, with no desktop-only interactions.
- [ ] React Doctor was run if the change was large.
- [ ] No secrets or student data in code or logs.

## Motion and touch feedback

- Animate only `transform` and `opacity`. Never `filter`, shadows or dimensions (the only exception is the collapsible panel height in `components/ui/collapsible.tsx`). No infinite JavaScript animation: loops are CSS keyframes.
- Every tappable element gets press feedback: `press` (rows, buttons, pills), `press-sm` (small icon buttons, switches) or `press-lg` (large cards and full-width rows). Use `Button` or one of these utilities; do not add `whileTap` per row.
- List entrances use the `rise` utility with `entranceRank` from `lib/motion.ts` (capped at `ENTRANCE_CAP`) and `useFirstVisit`, so revisiting a tab does not replay them. Content replacing a skeleton uses `content-in`.
- Tab changes are handled once in `MainLayout` (`page-enter`). Pages must not add their own entrance on top, except full-screen overlay pages (listed in `OVERLAY_PAGES`).
- Durations, easings and springs come from the `--duration-*` / `--ease-*` variables in `index.css` and from `lib/motion.ts`; keep both in sync.
- Moments forts (rubis récupérés, achat réussi, quête accomplie) : appeler `celebrate()` de `lib/celebrate.ts` ; `RewardBurst` (monté dans `MainLayout`) joue la gerbe, en CSS pur.

## Tabs stay alive

- Les six onglets (accueil, messages, agenda, devoirs, notes, apprendre) restent montés une fois visités, chacun dans une `<Activity>` de `MainLayout`. Un onglet masqué garde son état et son DOM, mais ses effets sont nettoyés puis relancés à l'affichage : un effet ne doit pas supposer que le composant est démonté en quittant l'onglet. Les écrans secondaires (rubis, absences, post-its) restent de simples routes.
- `HomeRoute` ne lit pas l'URL : `MainLayout` lui indique si les réglages sont ouverts et sur quelle section.

## HTML venu de l'ENT

- Jamais de `dangerouslySetInnerHTML` direct : passer par `RichHtml` (`components/RichHtml.tsx`), qui applique `sanitizeHtml` (`lib/html.ts`, liste blanche de balises, attributs et styles).
