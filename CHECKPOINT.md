# Checkpoint

Keep this file short: where we are, the next step, and facts a new session needs.
When a release ships, move its notes to `docs/release/history/` and start fresh.

## Where we are (2026-11-05)

- v0.3 "First item" is released as 0.3.0 (PR #1 merged). Notes: `docs/release/history/checkpoint-v0.1-v0.3.md`.
- Research branch `docs/research-mods` (PR open) added Editor refresh (v0.4), Effect Studio (v0.12) and Combat and bosses (v0.14); Liam approved all three. Branch `docs/renumber-releases` renumbers every release (old v0.4 Blueprint canvas is now v0.5, and so on). Notes are local in `docs/research/`.
- **Next: v0.4 "Editor refresh"** (then v0.5 "Blueprint canvas"): read the release file and the sections its prompt names.
- Carried over to v0.5: idle 3D frames over budget in 2 of 5 bench runs (ADR 0010); move pure ref
  helpers into a UI-free module shared by target and editors (ADR 0009).

## Next step

Branch `release/0.4-editor-refresh` (not pushed). All workstreams are built; the plan is in `docs/release/releases/v0.4-plan.md` (local).
Left: read the bench result in `docs/perf/0.4.md`, run `/code-review medium` and `/security-review` on the branch (fix what they find),
then open the PR "v0.4 Editor refresh" with the bench table. Never push to main or merge.

Built in v0.4 (see ADR 0011, still "proposed"):
- Shell: one-row titlebar (back, title, menus, quick actions with pixel icons, search), tabs, Paint/Look mode bar, resizable tree and inspector,
  bottom dock (Build log, Problems, History), command registry (`shared/commands/`), palette (Ctrl+K), shortcut sheet (?), layout memory per project.
- Inspector: tabs (Properties, Texture/Behaviour, Code), collapsible sections, checkboxes, draggable number fields with units; sections choose a tab with `tab=`.
- Workspace: `.blocksy/workspace-index.json` (paths only, git-ignored in every project, added to old projects on open), vanilla asset reader
  (`shared/vanilla/`, Rust returns bytes from the jar only), setup progress screen, "Build once to load Minecraft's look" fallback.
- Renderer in `packages/ui/src/minecraft/` (McScreen, McStage, nine-slice, cube, font). Creative tab and recipe editors draw the real screens.
- Item: Paint (paint studio in `packages/pixel`: zoom/pan, grid, coordinates, HSV picker, layers, frames timeline, live preview) and Look (slot, tooltip, hotbar).
  Block: Paint (studio + cube/tiled preview), Model (stub), Look (3D). Layers are optional data next to the flat texture (no formatVersion change).
- Typed imports: block and item textures (Resources menu). GUI/particle textures, sounds and models are greyed out until their studios exist.

Not done / decisions for Liam: free-floating panels and drag-from-desktop imports; block painting is on one shared texture (per-face painting needs
per-face textures from Model Studio); creative tab grid shows the first 45 entries (no scrolling); vanilla items that need entity renderers draw a placeholder.

## Useful facts (keep only what still matters)

- Write scripts with the Write tool into the scratchpad and run them; Bash heredocs with apostrophes break here.
  Python on Windows: open files with `encoding='utf-8', newline=''`.
- Dev server is fixed to port 1420 (5173/5174 belong to another project).
- E2E: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222 pnpm dev`, then drive via CDP
  (`http://127.0.0.1:9222/json`). Browser-only UI checks: `npx vite --port 1431` in apps/desktop (Tauri calls fail there).
  Import stores with the exact module URL from `performance.getEntriesByType("resource")`, or you get a second copy.
- shadcn: run the CLI from `packages/ui`, answer no to overwrites, fix `from "cn"`. Files that fail strict TS can't be
  edited, so don't install them (scroll-area was removed).
- React Compiler is on: components reading the mutable `logLines` buffer use `"use no memo"`.
- Tailwind scans packages via `@source` lines in `apps/desktop/src/index.css`; a new package with classes needs one.
- Fumadocs' Vite plugin needs the monorepo root (wrapper `docsMdx()` in `vite.config.ts`).
- Fabric/Minecraft APIs can be checked offline with `javap` on jars in `~/.gradle/caches/` (fabric-api and fabric-loom/26.1.2).
- Vanilla ids: `node packages/game-data/scripts/sync-vanilla-ids.mjs` (needs the Gradle cache); the list is the union of 26.1.2 and 26.3.
- 26.3 doubled blasting/smoking times (the adapter doubles them); 26.3 fuel/compost use `context_int_provider` data files,
  26.1.2 uses Fabric `FuelValueEvents` and `ComposterBlock.COMPOSTABLES`.
- Windows `cargo test` works because `build.rs` embeds the app manifest.
- `origin/HEAD` is set locally to `origin/main` so `/security-review` can diff.
- Heredocs with apostrophes or backslash escapes corrupt files (a `` became a backspace character): write files with the Write tool.
- React Compiler mangled an unused factory parameter (`even is not defined`); keep component factories simple. Pure fixes for `any`: file-level eslint-disable with a reason.
- Running the app: the dev server holds port 1420, so close other instances first. Bench: `BENCH_VERSION=0.4.0 pnpm bench` writes docs/perf/0.4.md (close the dev app first).
