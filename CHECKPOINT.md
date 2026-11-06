# Checkpoint

Keep this file short: where we are, the next step, and facts a new session needs.
When a release ships, move its notes to `docs/release/history/` and start fresh.

## Where we are (2026-11-06)

- v0.4.0 "Editor refresh" is released (PR #3 merged). Notes for v0.1 to v0.3: `docs/release/history/checkpoint-v0.1-v0.3.md`.
- IDE-style editor shell (PR #4) is merged; bench results in `docs/perf/`. ADR 0019.
- Branch `feature/welcome-window` (PR "feat: welcome window", not merged): **two windows** (ADR 0020). A fixed 820 x 640 welcome window (Projects, Learn,
  Community, Settings, New project, Clone) and the editor window. Opening or creating a project builds the editor and closes
  the welcome window; File > Close Project / New project / Open bring the welcome window back. Home page, icon rail, Docs and JDK
  pages and the old New project dialog are gone. All checks pass; tried in the real app (create, build, run, close, themes).
- **Next:** Liam runs the bench ("ready for bench": `BENCH_VERSION=0.4.0 pnpm bench`, close the dev app first; the bench now
  covers the welcome window first, then the editor), reviews and merges the PRs. Then v0.5 "Particle wand".
- Follow-ups done: Settings in the welcome window is one flat page; Learn shows just the lesson (Docs `compact` mode); a trust prompt
  (`features/welcome/trust.ts`, `trust-dialog.tsx`) asks before a folder is opened the first time (projects Blocksy creates and the
  recent list at first run are trusted; list in `trusted-projects.json`).
- **Roadmap re-sequenced (2026-11-06, branch `docs/vertical-slices`, docs only):** v0.5 to v0.16 became playable slices, each with a
  showcase Liam builds himself: 0.5 Particle wand, 0.6 Glowing block, 0.7 Charging magic circle, 0.8 Custom shapes (Model Studio),
  0.9 Animated mob (Animator), 0.10 Arcane infuser, 0.11 First screens (GUI Studio), 0.12 Crystal ore and gear, 0.13 Mana network, 0.14 Ship it, then v1.0. Advanced features moved to v1.1 to v1.7.
  Overview: `docs/release/plan/12-roadmap.md`. Every item's new home: `docs/research/scope-after.md` (200 of 200, 0 missing).
- **Fix next** (dogfooding list; add what annoys Liam after building each showcase): empty so far.
- Carried over to v0.5: idle 3D frames over budget in 2 of 5 bench runs (ADR 0010); move pure ref
  helpers into a UI-free module shared by target and editors (ADR 0009).

## The two windows (what a new session should know)

- `main.tsx` picks `WelcomeApp` or `EditorApp` from the Tauri window label (`shared/windows.ts`; in a plain browser use `?window=editor`).
- Rust (`commands/window.rs`): `open_editor`, `show_welcome`, `take_editor_launch`; sizes live in `tauri.conf.json` (`editor` has `create: false`).
  `git_clone` (https only) is in `history.rs`. Settings and the recent list sync between windows with events (`shared/sync.ts`).
- Welcome code: `pages/welcome/`, `widgets/welcome-nav|welcome-footer/`, `features/welcome/` (projects view, row menu, actions, clone, learn,
  community, start gate), `features/new-project/new-project-view.tsx` + `validate.ts`. Start gate list: `features/welcome/first-launch-views.ts`
  (empty; the sign-in view goes there in v0.14).
- Editor: File > New project / Open send the welcome window a one-shot intent (localStorage); Open Recent switches in place.
- Gotchas found: React StrictMode runs effects twice (the launch is taken once, module-level); the workspace setup must wait for the
  Java check (`javaChecked` in `editor-app.tsx`); CDP lists pages in no fixed order, so pick them by label.

## The new shell (what a new session should know)

- Layout: title bar (36) · activity bar (44) · explorer · tabs (32) + editor toolbar (32) + canvas · inspector · status bar (26).
  Sizes are tokens (`--b-titlebar-h`, `--b-activitybar-w`, `--b-tab-h`, ...) in both themes; `themes.test.ts` keeps them equal.
- Activity bar (`widgets/activity-bar/`): Overview, Search (palette), Library, History, Docs; bottom Build log, Problems, Settings.
  Views are tabs with ids `@overview @library @history @docs` (`shared/stores/editor.ts`, `isView`). Help > Docs (F1) opens the Docs tab in a project.
- Title bar: app icon (= Home), project name menu, menus, Build / Run / (Stop) / Export, panel toggles, flush window controls. No Debug (no debug feature yet).
- Tabs: scroll + list menu, pinned (left, no ×), dot = changed since last successful Build/Run (`shared/stores/built.ts`, session only,
  no dots before the first build). Tabs, pins and selection are in the per-project layout memory.
- Status bar: status only (CLAUDE.md rule). Items: build state, problems, update, Minecraft look, autosave (`useProject().autosave`), loader.
  JDK lives in Settings > Java (`tools.jdk` opens it; `setSettings(true, "java")`). Starting a Build without Java still goes to the `/jdk` page.
- Not done / for Liam: Library shows tinted initials, not real icons (id list only); no Account item until v0.8; History left the bottom dock.

## Useful facts (keep only what still matters)

- Write scripts with the Write tool into the scratchpad and run them; Bash heredocs with apostrophes break here.
  Python on Windows: open files with `encoding='utf-8', newline=''`.
- Dev server is fixed to port 1420 (5173/5174 belong to another project).
- E2E: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222 pnpm dev`, then drive via CDP
  (`http://127.0.0.1:9222/json`). Browser-only UI checks: `npx vite --port 1431` in apps/desktop (Tauri calls fail there).
  Import stores with the exact module URL from `performance.getEntriesByType("resource")`, or you get a second copy.
- shadcn: run the CLI from `packages/ui`, answer no to overwrites, fix `from "cn"`. Files that fail strict TS can't be
  edited, so don't install them (scroll-area was removed).
- React Compiler is on: components reading the mutable `logLines` buffer or command state use `"use no memo"`.
- Tailwind scans packages via `@source` lines in `apps/desktop/src/index.css`; a new package with classes needs one.
- Fumadocs' Vite plugin needs the monorepo root (wrapper `docsMdx()` in `vite.config.ts`).
- Fabric/Minecraft APIs can be checked offline with `javap` on jars in `~/.gradle/caches/` (fabric-api and fabric-loom/26.1.2).
- Vanilla ids: `node packages/game-data/scripts/sync-vanilla-ids.mjs` (needs the Gradle cache); the list is the union of 26.1.2 and 26.3.
- 26.3 doubled blasting/smoking times (the adapter doubles them); 26.3 fuel/compost use `context_int_provider` data files,
  26.1.2 uses Fabric `FuelValueEvents` and `ComposterBlock.COMPOSTABLES`.
- Windows `cargo test` works because `build.rs` embeds the app manifest.
- `origin/HEAD` is set locally to `origin/main` so `/security-review` can diff.
- Heredocs with apostrophes or backslash escapes corrupt files: write files with the Write tool.
- React Compiler mangled an unused factory parameter (`even is not defined`); keep component factories simple. Pure fixes for `any`: file-level eslint-disable with a reason.
- Running the app: the dev server holds port 1420, so close other instances first. Bench: `BENCH_VERSION=0.4.0 pnpm bench` writes docs/perf/0.4.md (close the dev app first).
