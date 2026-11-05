# 2. Architecture rules (read before every release)

The goal: **new features plug in; old features never get rewritten to make room.** If a release needs to refactor or remove earlier work, the architecture failed, and the fix is to improve the extension point, not to patch around it.

### 2.1 Everything is a plugin into a registry

Each kind of thing Blocksy knows about is a self-contained **module** registered in a central registry. Adding a new kind means adding a new folder and one registration line. Nothing else changes.

| Registry | One module contains |
| --- | --- |
| Element types (block, item, block entity, GUI, entity, ...) | Schema, default values, editor panel, generator templates, Docs reference page, tests |
| Node types | Pin definitions and types, inspector fields, code template, Docs page, example graph, tests |
| GUI components (slot, button, gauge, ...) | Schema, canvas renderer, style options, Java runtime template, Docs page |
| Model formats (block/item, entity) | Format rules, exporter, importer, validation |
| Model Studio tools (move, paint, UV, animate, ...) | Tool UI, document commands, keyboard shortcuts |
| Loader targets (Fabric now, NeoForge later) | Template source, file layout, API adapters for every element and node |
| Themes (Modern, Minecraft) | Token values and theme-specific assets only |
| Docs demos | A sandboxed instance of a real editor component plus its starting data |

### 2.2 Hard rules

1. **Data first, versioned.** The project file has a `formatVersion`. Any change to it ships with a migration and a migration test. Old projects always open.
2. **The generator is pure.** `(project data, target) → files`. No UI, no side effects, no hidden state. Covered by golden-file snapshot tests: the same input always produces byte-identical output.
3. **One template per node and per element**, small and commented, so a junior developer can read what Blocksy wrote and why.
4. **No reaching across modules.** Features talk through registries, typed events and public interfaces. Enforce import boundaries with lint rules (for example `eslint-plugin-boundaries` or dependency-cruiser).
5. **Loader-agnostic core.** Nothing outside a loader target module mentions Fabric or NeoForge. Adding NeoForge after 1.0 must be a new target module only.
6. **Library adapters.** Third-party libraries (node canvas, code editor) sit behind a thin Blocksy interface, so a library can be swapped without touching features. React Three Fiber is the 3D foundation itself, but scene contents are built from Blocksy documents, never stored as Three.js objects.
7. **Documents are the only source of truth.** Editors (node canvas, Model Studio, GUI Studio) edit Blocksy documents through commands, which also gives undo/redo for free.
8. **The Rust layer stays thin:** filesystem, processes (Gradle, Java), git, OS dialogs. All product logic lives in TypeScript where it is testable.
9. **Design tokens only.** Components never hard-code colours, radii, fonts or spacing. Both themes must work for every component from the day it ships.
10. **Never ship Minecraft's code or assets.** Sources, textures and GUI art are generated or read from the user's own machine at build time.
11. **Never copy GPL code into Blocksy** (for example Blockbench, which is GPL-3.0). Study behaviour and file formats; write original code.
12. **Decisions are written down.** Any architectural choice gets a short ADR in `docs/decisions/` (context, decision, consequences).
13. **Prefer proven libraries.** Before building a mod-side system (effects, animation, spells, combat), research whether a maintained library already does it, and record the choice in an ADR: depend on it, or build our own. Examples of what to look for:
    - Particles and effects: CooParticlesAPI (particle compositions, emitters, magic circles), Lodestone (screenshake, configurable particles)
    - Animation: GeckoLib (keyframe animation for entities, blocks, items and armor), PlayerAnimator (player poses)
    - Spells and combat: Spell Engine (data-driven spells), Better Combat (weapon animations)
    - Shaders and screen effects: Satin API

    For each candidate, check: license, supported loaders and Minecraft versions, extra dependencies (for example CooParticlesAPI needs the Kotlin language adapter), and whether it is still maintained. Every library becomes a module in the Libraries registry with its license, versions, the nodes it unlocks and a credit entry. GPL or unknown licenses are never added without warning the user, because they can affect the license of the user's own mod.

### 2.3 Repository layout: one monorepo

Blocksy is **one repository** using **pnpm workspaces**: the desktop app plus many small internal packages. Packages are folders in the same repo, not separately published libraries, so there is one install, one version, one commit per change across them. The package boundaries are what make the lint import rules (2.2, rule 4) enforceable. Add Turborepo only if build times start to hurt.

```text
apps/desktop/             Tauri shell (Rust: fs, process, git) + React app
packages/core/            project model, schema, migrations, registries, commands, events
packages/generator/       pure codegen engine + golden tests
packages/targets/fabric   loader target (templates, file layout, adapters)
packages/elements/*       one folder per element type
packages/nodes/*          one folder per node family
packages/model-studio/    model document, formats, tools, R3F viewport
packages/gui-studio/      GUI document model, components, style engine
packages/ui/              design system: tokens, themes, components
packages/docs/            MDX content, demo components, community data
packages/bench/           performance harness and benchmark projects
docs/                     this plan, ADRs (decisions/), design inspiration (design/), perf results (perf/)
```

### 2.4 Definition of done (every release)

- [ ] The release's in-game "Done when" test passes
- [ ] Every catalog item (section 3) assigned to this release is done
- [ ] Performance budget (section 4) passes on the reference machine, with results added to `docs/perf/`
- [ ] No earlier module was refactored to fit new work (if one was, an ADR explains why and how the extension point now prevents it)
- [ ] Every new component works in both the Modern and Minecraft themes
- [ ] Every new node and element has its Docs reference page and a live demo
- [ ] Golden tests cover every new template; migrations exist for any format change
- [ ] Bindings are regenerated and committed; no frontend code calls `invoke` directly
- [ ] Lint boundaries, type checks and tests pass
- [ ] `/code-review` and `/security-review` run on the release branch, findings fixed or explained
- [ ] End-to-end test in the real app: create, Build, Run, and the in-game "Done when" check
- [ ] "Make it alive": small lively components (loaders, status, backdrops, success moments) researched and used where they fit (CLAUDE.md)

### 2.5 Rust and frontend bindings (tauri-specta)

The frontend and Rust talk through **one generated file**, the same pattern as Ezel: `apps/desktop/src/shared/bindings.ts`, generated by tauri-specta from the Rust commands, events and types. Nobody edits it by hand.

- **Commands** are typed functions (`commands.runGradle(...)`), each with a doc comment that becomes the TypeScript doc. Frontend code never calls `invoke` with a string name; a lint rule enforces it.
- **Every command returns a result**, never throws: `{ status: "ok", data }` or `{ status: "error", error }`.
- **One error contract:** `AppError` is `{ code, message }`, with a stable `ErrorCode` enum in snake_case (for example `internal`, `invalid_input`, `not_found`, `java_missing`, `gradle_failed`, `unsupported`, `unavailable`). Adding a code is fine; renaming one is a breaking change.
- **Events** are typed too (`events.buildProgress.listen(...)`, `events.updateStatus.listen(...)`), for anything Rust pushes: Gradle output, game running, file changes, update ready.
- Bindings regenerate on a debug run and on `cargo test`. If a check leaves `bindings.ts` changed, the bindings were stale and get their own commit first (the `/release` command checks this).
- Keep the Rust surface small (rule 2.2.8): commands move data in and out; product logic stays in TypeScript.

### 2.6 Auto-updates and releases

Blocksy updates itself, the same way Ezel does.

- **Tauri updater plugin** with signed updates. The app checks GitHub Releases on startup and every few hours, downloads in the background, and shows a quiet "Blocksy X.Y.Z is ready, restart to update" note (`events.updateStatus`, `commands.installUpdate`).
- **Never interrupt work:** no install while Gradle is building or Minecraft is running; projects autosave before the restart. Project migrations (rule 2.2.1) mean old projects open in the new version.
- **Signing key** lives outside the repo in `.private/updater/` (ignored by git). Its password belongs in a password manager and GitHub Actions secrets, not in a text file next to the key. Losing the key means existing installs can never update again, so back it up.
- **Release pipeline:** the `/release` command (`.claude/commands/release.md`) runs every check, bumps the version, writes the changelog and makes an annotated tag locally. `pnpm release` pushes main and the tag; the tag starts a GitHub Action that builds the installers, signs the update and attaches the update manifest to a draft release. Publishing the draft is what makes the update go out.
- **Versions follow this plan:** finishing plan release 0.N ships as app version 0.N.0; fixes in between are patches (0.N.1). v1.0.0 is the real test passed.
- Release reports go in `.private/releases/` (ignored by git), as in Ezel.
