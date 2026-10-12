# AGENTS.md

Instructions for AI coding agents working on Scolup.

## 1. Project overview

Scolup is an alternative front-end for EcoleDirecte (French school portal): grades with averages, agenda, homework, messages, absences, post-its. UI text is **French**.

- **Stack:** React 19 + Vite + TypeScript (strict) + Tailwind v4 + react-router. Node >= 22.
- **Mobile-first.** It needs to be thought with mobile in mind (with PWA)
- **UI:** shadcn/ui (style `base-rhea`, Base UI primitives, `hugeicons` icons, `motion` for animation, `vaul` drawers, `recharts` charts). Extra registry: `@shark` (`https://shark.vini.one/r/{name}.json`).
- **Data:** EcoleDirecte data goes through **Linkdirecte** (docs: https://github.com/Scolup/Linkdirecte/wiki), which calls the **Procsy** proxy (Cloudflare Worker, needed because of CORS and the required user agent). Check the wiki before writing any new data call or mapping.

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
  main.tsx, App.tsx, shell.tsx   entry, route loaders (lazy), main app shell
  onboarding/                    first-run flow (welcome, theme, login)
  pages/<feature>/               home, agenda, grades, homework, messages,
                                 absences, postits, settings, Lessons.tsx
    <Feature>.tsx                page component
    components/                  feature-only components
    hooks/                       use<Feature>.ts (data), use<Feature>Page.ts (UI state)
    helpers.ts                   pure logic (this is what gets unit-tested)
  components/ui/                 shadcn components (+ ui/shark/ from the registry)
  hooks/                         shared hooks (use-async, use-media-query, ...)
  services/                      linkdirecte.ts, storage.ts, errors.ts, haptics.ts,
                                 dates.ts, subjects.ts, ...
  lib/utils.ts                   cn()
tests/                           bun:test files, e.g. grades-helpers.test.ts
```

Follow the existing split when adding a page: data hook, page-state hook, pure `helpers.ts`, presentational components.

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
- Import with the `@/` alias (maps to `src/`).
- Design guidance lives in `.agents/skills/` (`frontend-design`, `impeccable`, `microinteractions`, `shadcn`). Read the relevant one for UI work.

### Data, storage and errors
- All EcoleDirecte access goes through the shared `ld` client in `src/services/linkdirecte.ts`. Don't call EcoleDirecte or the proxy directly.
- Async data in hooks: use `useAsync` from `@/hooks/use-async` (handles cancellation) rather than hand-rolled effects.
- Persistent app data: IndexedDB via `src/services/storage.ts` (`idb`). Changing the schema means bumping the DB version and handling the upgrade path in `getDB()`.
- Show errors to users with `errorMessage(err, fallback)` from `src/services/errors.ts` so Linkdirecte error codes become friendly French messages.
- Credentials, tokens and student data are sensitive: never log them, commit them, or put them in URLs.

### TypeScript
`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` and `erasableSyntaxOnly` are on: use `import type` for types, and no enums or parameter properties.

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

### Keep current structure
The philosophy for code quality is :
- Keeping the same file structure,
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
- Mark intentional shortcuts with a `ponytail:` comment. If the shortcut has a known ceiling (O(n^2) scan, naive heuristic), name the ceiling and the upgrade path.

Not lazy about: understanding the problem, input validation at trust boundaries, error handling that prevents data loss, security, accessibility, real-device calibration, and anything explicitly requested.

### Make surgical changes
- Every changed line should trace to the request.
- Match existing style, even if you'd do it differently. Don't refactor or reformat adjacent code.
- Remove imports, variables and functions that *your* change made unused. Leave pre-existing dead code alone and mention it instead.

### Fix root causes
A bug report names a symptom. Grep every caller of the function you're touching and fix the shared function once, rather than patching only the reported path.

### Verify
- Turn the task into a checkable goal ("fix the bug" becomes "reproduce it, then make it pass").
- Non-trivial logic leaves one small runnable check: a `bun:test` file in `tests/` (see `tests/grades-helpers.test.ts`). Put testable logic in `helpers.ts` so it can be tested without React. Trivial one-liners need no test.
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
