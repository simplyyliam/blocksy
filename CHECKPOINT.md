# Checkpoint: v0.2 "First block"

Last updated: 2026-10-30. Read this first in a new session, then `CLAUDE.md` and
`docs/release/blocksy-release-plan.md` (sections 2, 4, 5, 11 and "v0.2 First block" in 13).
v0.2 work is merged into `main` (branch `feature/v0.2-first-block`, merged with `--no-ff`).

## The shape of v0.2 (decided, see ADR 0006)

```text
packages/elements/block         schema, options, inspector, 3D canvas, docs data, PNG helpers, tests
packages/elements/creative-tab  schema, inspector, inventory-sketch canvas, docs data, tests
packages/model-studio           CubeModel document + BlockPreview (R3F, frameloop="demand", dpr<=1.5)
packages/targets/fabric         adapters for block + creative_tab (loader code lives in the target)
core                            LoaderTarget.adapters / prepareTasks, ElementType.docs / plural,
                                ElementEditorProps, deriveElementId, renameElement (all optional/additive)
generator                       one line: element template ?? target adapter
```

Textures are stored as base64 16x16 PNGs inside element data, so the generator stays pure.
Fabric output uses data generation (models, blockstates, loot tables, tags via `runDatagen`);
lang stays a plain en_us.json written by the generator.

## Done

| Area | Where | Notes |
| --- | --- | --- |
| Core extension points | `packages/core/src/modules.ts`, `project.ts`, `project-commands.ts` | optional fields only (ADR 0006); `element-id.test.ts` |
| Block element | `packages/elements/block` | name, hardness, resistance, tool + tier, needs-tool, light, sound, map colour, 16x16 texture, tab; inspector shows the Java per field |
| Creative tab element | `packages/elements/creative-tab` | title, icon; blocks join via their `tab` field; inventory-sketch canvas |
| Fabric adapters + datagen | `packages/targets/fabric/src/elements`, `templates/content.ts` | ModBlocks, ModCreativeTabs, model/loot/tag providers, lang JSON; golden `first-block`; `pnpm test:gradle` builds a block mod on 26.1.2 and 26.3 and checks the generated JSON (passed) |
| Build pipeline | `apps/desktop/src/shared/sync-files.ts`, Rust `gradle.rs`, `files.rs` | files written before Build/Run, stale ones removed via `.blocksy/generated.json`, `runDatagen` as its own Gradle run, skipped when unchanged |
| 3D preview | `packages/model-studio` | lazy-loaded R3F, render on demand, redraw on resize, `zoom` prop, `onReady` + `CanvasLoader` |
| Project editor | `apps/desktop/src/pages/project`, `features/project-editor` | tree + canvas + inspector flush on white, pill toolbar (Design/Code, undo/redo), Overview page, read-only Code tab (Shiki via `CodeView`) |
| Router | `apps/desktop/src/app/router.tsx`, `layouts/` | react-router memory router; AppLayout (rail) / ProjectLayout (back button, no rail) (ADR 0007) |
| Minecraft theme | `packages/ui/src/theme/minecraft.ts`, `scripts/make-pixel-art.mjs`, `styles.css` | original pixel art, Pixelify Sans (OFL), bevels, `radius-pill`; parity test |
| Docs | `packages/docs` | Fumadocs behind `<DocsApp>`; Learn/Guides/Reference (generated)/Concepts/Community/Credits; Kaupenjoe videos (ids verified via oEmbed); credits footer |
| Starter block | `apps/desktop/src/features/new-project/starters.ts` | default in New project |
| Lively bits | Dot Matrix (status), Dot Pattern (canvas), Confetti (first mod load) | CLAUDE.md "Make it alive" |
| Security review | run 2026-10-30 | no findings; suggestion: validate element ids on load |

| Code review | `/code-review` 2026-10-30 | 10 findings, all fixed (commit "fix: code review findings") |
| Bench | `docs/perf/0.2.md`, ADR 0008 | cold start 1093 ms, frame p95 17.0 ms, memory 408 MB (+27% vs 0.1, explained), idle 3D frames 0 |
| E2E (release app) | `scratchpad/cdp/e2e.mjs` (not in repo) | Starter block → first build 60 s → Run → "Your mod is loaded"; jar holds ModBlocks, models, texture, loot table (drops itself), mineable/pickaxe tag |

## Still to do for v0.2

1. **Liam, in game:** open the creative tab, place First Block, mine it with a pickaxe (drops) and by hand (nothing).
   Project for it: `~/Blocksy/blocksy_v02_e2e` (made by the e2e test; delete it afterwards if you like).
2. `/release` for 0.2.0 when happy (Liam pushes with `pnpm release`).
3. Notes for later: Docs MDX content names Fabric (tutorial content, not code); validate the
   `.blocksy/generated.json` manifest; Docs search (v0.7); lang provider vs en_us.json (v0.3 lang editor).

## v0.1 "Foundation" (done, merged)


| Area | Where | Notes |
| --- | --- | --- |
| Monorepo, lint boundaries | root, `eslint.config.js` | pnpm workspaces; apps may import packages; core imports no @blocksy package; only `src/index.ts` (+ `@blocksy/ui/styles.css`) importable; no direct `invoke` (lint rule on) |
| Registries (all 8) | `packages/core/src/registries.ts` | element types, node types, GUI components, model formats, Model Studio tools, loader targets, themes, docs demos |
| Project file + migrations | `packages/core/src/project.ts`, `migrations.ts` | `formatVersion: 1`, migration runner, refuses newer files |
| Commands + undo/redo | `packages/core/src/commands.ts` | snapshot store; project autosaves through it |
| Pure generator + golden tests | `packages/generator` | golden files in `src/__golden__/empty-mod`; dummy element test proves "one folder + one registration line" |
| Fabric target, pinned + tested | `packages/targets/fabric` | MC 26.1.2 and 26.3, Loom 1.19.3 (not SNAPSHOT), loader 0.20.1, Gradle 9.8.2, Java 25. `pnpm test:gradle` builds both for real (passed) |
| Design system, Modern theme | `packages/ui` | **shadcn/ui only** (ADR 0005): stock files in `components/ui`, AI Elements in `components/ai-elements`; look comes from tokens (`theme/modern.ts`) + shadcn vars in `styles.css`. Blocksy-only: `PixelLoader`, `ElapsedTime` (NumberFlow) |
| App redesign (2026-10-30) | `apps/desktop/src` | shadcn Sidebar with project switcher, slim header that is also the custom titlebar (window controls, drag region), Settings as a Claude-style dialog, Home as a card grid / list with generated or custom covers (`.blocksy/cover.*`), context menus (projects, build log, details), first build as an AI Elements timeline, interaction details (gliding highlight, card lift, pixel burst), 10px padding, Linear-like proportions (28px toolbar, 6px radius) |
| Bench runner | `packages/bench/scripts/run.mjs` | `pnpm bench`; refuses to run while another Blocksy is open |
| ADRs 0002-0005 | `docs/decisions/` | stack, registries, bindings/errors/updater, shadcn-only |
| tauri-specta bindings | `apps/desktop/src-tauri/src`, `src/shared/bindings.ts` | `AppError {code,message}`, snake_case `ErrorCode`, events GradleOutput/GradleFinished/UpdateStatus; regenerated by debug run and `cargo test` |
| App shell + pages | `apps/desktop/src` | widgets (sidebar, header, status-bar, bottom-panel) + features; Home, project, Docs, Settings, JDK setup; New project dialog (matches add-project.png); dynamic status bar views |
| Build / Run / Export | `src/shared/project-actions.ts` | first-build progress screen; Build log |
| **E2E proof** | manual, 2026-10-29 | Create → first build → Run: Fabric logged `Loading 51 mods: - blocksy_e2e_test 1.0.0`, status bar showed "Your mod is loaded" |
| Updater + release pipeline | `tauri.conf.json`, `scripts/`, `.github/workflows/release.yml` | updater off until a key exists; `pnpm updater:keygen`, `pnpm release`, draft releases with `latest.json` |
| Bench hook in the app | `apps/desktop/src/app/bench.ts`, Rust `commands/bench.rs` | runs only with `BLOCKSY_BENCH=<report path>`; writes JSON then quits |

## Useful facts


- Browser-only preview for UI checks: `npx vite --port 1431` in apps/desktop, then drive it with
  headless Edge + CDP. Tauri calls fail there (expected); set stores via `import()` of the exact
  module URL from `performance.getEntriesByType("resource")` (HMR adds `?t=`).
- shadcn CLI: run from `packages/ui`, answer **no** to overwrites, then fix `from "cn"` and remove the `cn` package.

- E2E driving: start the app with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222 pnpm dev`
  and use Chrome DevTools Protocol (`http://127.0.0.1:9222/json`) to click/type in the page.
- Ports 5173/5174 are used by another project on this machine; Blocksy's dev server is fixed to 1420.
- Windows: `cargo test` works because `build.rs` embeds the app manifest into every binary.
- The React Compiler is on: components reading the mutable `logLines` buffer use `"use no memo"`.
- Fabric API names for 26.1.2 can be checked offline: jars in `~/.gradle/caches/modules-2/files-2.1/net.fabricmc.fabric-api/`
  and Minecraft in `~/.gradle/caches/fabric-loom/26.1.2/` (`javap`); Fabric's `.classtweaker` files make some vanilla
  datagen helpers public (e.g. `BlockModelGenerators.createTrivialCube`, `BlockLootSubProvider.dropSelf`).
- shadcn files that fail strict TS (unused imports) can't be edited: don't install them (scroll-area was removed).
- Python edits on Windows: open files with `newline=''` or they get CRLF.
- Browser checks: `npx vite --port 1431` in apps/desktop + headless Edge with `--remote-debugging-port`; import
  stores with the exact module URL from `performance.getEntriesByType("resource")`, or you get a second copy.
- Fumadocs' Vite plugin needs the monorepo root as its root (wrapper `docsMdx()` in `vite.config.ts`).
- Tailwind scans `packages/elements` and `packages/model-studio/src` from `apps/desktop/src/index.css`;
  a new package with Tailwind classes needs an `@source` line there.
- `origin/HEAD` was set locally to `origin/main` so `/security-review` can diff.
