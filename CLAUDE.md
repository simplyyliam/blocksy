# Blocksy

Blocksy is a Tauri desktop app for making Minecraft mods with nodes, visual editors and
live docs, while teaching Java along the way. It scales from one block to a full tech mod.

## Read first

- Before any release work: `docs/release/blocksy-release-plan.md` (the source of truth).
- Before any UI work: `docs/design/`. The look to match now is `home-page(redesign).jpg`:
  calm, borderless, icon rail, good typography and space (13px base type, smooth motion).
  add-project.png is my Figma design for New project. Release-specific references are
  noted in the plan (project editor v0.2, Model Studio v0.5, sign-in window v0.7).
- Build only what the current release covers; ideas for later releases go into their
  section of `docs/release/blocksy-release-plan.md` as notes, not code.
- Decisions live in `docs/decisions/` (ADRs). New architectural choice = new ADR.

## Hard rules (plan section 2.2)

1. Data first, versioned: `formatVersion` changes ship with a migration and its test.
2. The generator is pure: `(project data, target) -> files`, golden-file tested.
3. One small, commented template per node and per element.
4. No reaching across modules: registries, typed events, public `index.ts` only (lint enforces).
5. Loader-agnostic core: only `packages/targets/*` may mention Fabric or NeoForge.
6. Third-party libraries sit behind thin Blocksy adapters; R3F scenes come from Blocksy documents.
7. Documents are the only source of truth; editors change them through commands (undo/redo).
8. Rust stays thin: filesystem, processes, git, OS dialogs. Product logic is TypeScript.
9. Design tokens only; every component works in both Modern and Minecraft themes.
   UI components are **shadcn/ui** (see "UI components" below), never hand-rolled or edited.
10. Never ship Minecraft's code or assets.
11. Never copy GPL code (e.g. Blockbench); study behaviour, write original code.
12. Architectural decisions get a short ADR in `docs/decisions/`.

## Layout

```text
apps/desktop/            Tauri shell (Rust in src-tauri/) + React app
packages/core/           project model, schema, migrations, registries, commands, events
packages/generator/      pure codegen engine + golden tests
packages/targets/fabric/ Fabric loader target (templates, file layout, adapters)
packages/elements/*      one package per element type     packages/nodes/*  one per node family
packages/model-studio/   model document, formats, tools, R3F viewport
packages/gui-studio/     GUI document model, components, style engine
packages/ui/             design system: tokens, themes, shadcn/ui components
packages/docs/           MDX content, demos, community data   packages/bench/  perf harness
docs/                    plan, ADRs (decisions/), design inspiration, perf results
```

`core` imports no other `@blocksy` package. Nothing imports from `apps/`.

## UI components (shadcn/ui)

> **DO NOT MODIFY INSTALLED SHADCN COMPONENTS!** You may only replace the cn import with
> `import { cn } from "@blocksy/ui/lib/utils"`. That is all.

- Use shadcn/ui for every UI piece (buttons, inputs, dialogs, selects, tooltips, sidebar,
  toasts, ...). Write a custom component only when shadcn has nothing that fits, and say why
  in its header comment. Never delete or replace shadcn components with hand-made ones.
- They live in `packages/ui/src/components/ui/` (config: `packages/ui/components.json`,
  style `base-luma` = Base UI underneath). Add one from `packages/ui`:
  `pnpm dlx shadcn@latest add <name>`. Answer **no** when it asks to overwrite a file.
- After adding, check for a bare `import { cn } from "cn"` (a CLI bug): change it to
  `@blocksy/ui/lib/utils` and remove the `cn` npm package if it was installed.
- Export new components from `packages/ui/src/index.ts`; the app imports only `@blocksy/ui`.
- **Never edit installed shadcn / AI Elements files.** Leave them exactly as the CLI wrote
  them (the only allowed change is the `cn` import fix above). Get the Blocksy look from:
  theme tokens (`packages/ui/src/theme/modern.ts`: radius scale, text sizes, shadows),
  the shadcn variables in `styles.css` (they point at Blocksy tokens `--b-*`), and
  props/className where a component is used (`size="sm"` for 32px pills, `--sidebar-width`).
- AI Elements (elements.ai-sdk.dev) are shadcn registry items: add them the same way, they
  land in `packages/ui/src/components/ai-elements/`.
- **Make it alive (every release).** Before building a release's UI, research small shadcn-registry
  libraries that add life (assistant-ui Dot Matrix, Magic UI, Animate UI, React Bits, motion
  primitives, pixel/matrix loaders) and use the best fit where it helps: loaders, status, empty
  states, canvas backdrops, success moments. Respect reduced motion; keep them small. Picks so far
  (v0.2): Dot Matrix (status), Dot Pattern (canvas backdrop), Confetti (first in-game success).
- Blocksy-only components (no shadcn equivalent) live in `packages/ui/src/components/`
  (e.g. `PixelLoader`, `ElapsedTime`); third-party libraries get a thin adapter there.

## Frontend structure (apps/desktop/src)

- `app/` root and module registration · `pages/` full views · `shared/` bindings, stores, helpers
- `widgets/` are the parent bodies (sidebar, header, status-bar, bottom-panel); `features/`
  hold what goes inside them, grouped by widget name. Example: `widgets/status-bar/statusbar.tsx`
  renders the pieces in `features/status-bar/`. A feature never edits another feature.
- The status bar is dynamic: each file in `features/status-bar/` is a *view* with a
  `when(state)` check and a priority; the widget shows the best match (idle, building,
  game running, update ready, ...). New view = new file + one line in the list.

## Git workflow (feature merges)

- Never commit straight to `main`. Branch `feature/<name>` (or `fix/`, `chore/`, `docs/`)
  from `main`, make small commits, then `git merge --no-ff` into `main` and delete the branch.
- Commit message bodies are bullet points, never paragraphs.

## Commands

- Root: `pnpm dev` (desktop app), `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm bench`
- Root: `pnpm test:gradle` (real Fabric builds), `pnpm release`, `pnpm updater:keygen`
- In `apps/desktop/src-tauri`: `cargo check`, `cargo clippy --all-targets`, `cargo test`

## Never

- Never edit `apps/desktop/src/shared/bindings.ts` by hand (generated by tauri-specta).
- Never call Tauri's `invoke` directly; use the generated `commands` (lint enforces).
- Never read, print or commit anything in `.private/` (signing key, release reports).

## Working with me

- I'm a junior developer and a visual learner: explain decisions in plain words,
  use diagrams or tables when they help, and keep code small and commented.
- Every task ends with a **STATUS / CHECKS / NEEDS YOUR DECISION** block.
- Before that block, at the end of release work: run `/code-review` and `/security-review` on the
  branch (fix what they find), and run the end-to-end test in the real app (create a project, Build,
  Run, check the release's "Done when" in game). Report all three under CHECKS.
- Release work keeps `CHECKPOINT.md` current as it goes, so a new session can pick up where the last stopped.
