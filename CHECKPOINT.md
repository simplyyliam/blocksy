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

Branch `release/0.4-editor-refresh`. Plan approved (plan in `docs/release/releases/v0.4-plan.md`, local).
**Workstreams 1, 2, 3 are built and checked in the real app (shell with menu bar, toolbar, palette, tabs,
resizable panels, tree, dock). Liam asked to STOP here and review before workstream 5 onward.**
Then follow the work order: 5 (workspace setup + index), 6 (asset reader, ADR 0011 update), 7 (renderer), 8 (editors), 4 (imports), 9 (polish, bench, review, e2e).

Decisions from Liam when approving the plan:
- `.blocksy/` (the workspace index holds machine-specific paths) goes into the `.gitignore` Blocksy writes into every project,
  and is added to existing projects' `.gitignore` when they open. Never committed or synced. Do this in workstream 5.
- History is not a dock tab (it is a page/tab with its own commit box); the dock has Build log and Problems.

Shell facts (v0.4):
- Command registry: `shared/commands/` (`builtin.ts` = every command, `menus.ts` = menu layout). Menus, toolbar, palette and shortcuts
  read it. Components that show command state need `"use no memo"` (the compiler would cache `isEnabled`).
- Tabs and panel state: `shared/stores/editor.ts`. Layout memory per project: `shared/layout-memory.ts` (app-data name must be
  plain lowercase, no `.json`). Panels stay mounted and collapse (3D canvas must not restart); only swap side / Reset layout remount.
- Resources menu imports are registered but disabled until workstream 4.
- shadcn CLI: use `npx --no-install shadcn add <name>` in `packages/ui` (the `pnpm dlx` route hung on the network). It also writes
  bad aliases (`@/blocksy/...`) besides `from "cn"`: fix them to `@blocksy/ui/...`.
- Known: item editor's floating tools overlap when the dock is open (short canvas); fix in workstream 8.
- Not yet run: `pnpm bench`, `cargo` checks, /code-review, /security-review, full e2e (Build, Run).

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
