# Blocksy release plan

> **For Claude Code:** this is the source of truth for what Blocksy is and the order it gets built in. Read it fully before starting any release. Each release ends with a `/goal` prompt. Before any UI work, look at the inspiration images in `docs/design/`. Use them for mood, layout and feel; never copy them pixel for pixel. Every release must pass the performance budget in section 4 on the reference machine.

Last updated: 2026-10-29 · Owner: Liam Matthews

---

## 1. What Blocksy is

Blocksy is a desktop app (Tauri) for making Minecraft mods with nodes, visual editors and live docs, while teaching Java along the way. It scales from "I made one block" to a full tech mod.

The plan reaches **v1.0.0 in 14 releases**. Every release ends with something you can run in Minecraft. Section 3 lists every feature a full mod needs and which release delivers it.

**Stack** (confirm versions in an ADR during v0.1):

- Tauri 2, with Rust only for the thin native layer (files, processes, git)
- **tauri-specta** for generated, typed bindings between Rust and the frontend (section 2.5)
- **Tauri updater plugin** for signed auto-updates from GitHub Releases (section 2.6)
- React + TypeScript + Vite for the UI
- **React Three Fiber** (with drei) for every 3D view: block previews, Model Studio, entity previews
- Node canvas library behind an adapter (React Flow recommended, section 9)
- Gradle and the official loader toolchain for builds

### The three v1.0.0 tests

1. **A block:** custom textured block with states, drops and a recipe.
2. **An item:** a crafted item with behaviour from nodes.
3. **A full mod:** a playable slice of *Aetheric Storage Engineering* with ore, worldgen, machines, energy, beautiful custom GUIs, custom recipes, an animated entity, advancements and a release jar.

---

## 2. Architecture rules (read before every release)

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

---

## 3. Feature catalog: everything a full mod can contain

This is the master checklist. "Can Blocksy build a full mod?" is answered line by line here. It was built from Fabric's developer guide topics, AE2's structure (section 6) and IntelliJ's tooling (section 7).

| Area | Features | Release |
| --- | --- | --- |
| Project and build | Official template, pinned versions, Run client, Build, Export jar, first-build progress | 0.1 |
| | Reload textures and models in a running game | 0.5 |
| | Run a dedicated server, code hotswap while the game runs | 0.12 |
| Blocks: basics | Hardness, resistance, tool, light, sound, map colour, drops itself, creative tab | 0.2 |
| Blocks: states and models | Facing, lit, powered, waterlogged, custom states, model per state, collision shapes | 0.5 |
| Blocks: families | Slabs, stairs, walls, fences, fence gates, doors, trapdoors, buttons, pressure plates, pillars (logs) | 0.6 |
| Blocks: rendering | Transparent and cutout (glass, leaves), tinting (grass-style colour), emissive textures | 0.6 |
| Blocks: plants | Crops with growth stages, flowers, saplings and trees | 0.6 (tree worldgen 0.10) |
| Blocks: behaviour | Falling blocks, ores that drop XP, redstone emit and receive, comparator output | 0.6 |
| Items: basics | Stack size, rarity, fire resistance, food, fuel, compostable, tooltips | 0.3 |
| Items: types | Tools and tool materials, armor, shields | 0.10 |
| | Bows and crossbows, throwables, buckets, music discs | 0.10 |
| | Spawn eggs | 0.11 |
| Items: data | Data components (items that carry data), dynamic tooltips | 0.8 |
| Textures | Pixel editor, palettes, animated textures | 0.3 |
| | Paint directly on 3D models | 0.5 |
| Recipes and tags | Crafting, smelting, blasting, smoking, stonecutting, tags | 0.3 |
| | Custom recipe types for machines | 0.8 |
| Behaviour | Event, logic and action nodes, custom code node | 0.4 |
| Machines | Block entities, inventories, ticking, saved data, data attachments, block entity renderers | 0.8 |
| | Energy storage and transfer, item transfer between blocks | 0.8 |
| | Fluid storage and transfer | 0.12 |
| GUIs | Vanilla screen import, fully custom screens, styles, animation, data binding | 0.9 |
| | Config screens | 0.10 |
| | HUD overlays | 0.12 |
| Models (Model Studio) | Block and item models, UV, display settings, `.bbmodel` import and export | 0.5 |
| | Entity models with bones and pivots, keyframe animation, armor models | 0.11 |
| World | Ore and feature generation, structures (NBT), biomes, dimensions | 0.10 |
| | Villager professions and trades | 0.10 |
| Entities | Mobs, attributes, spawn rules, AI goals, projectiles, renderers | 0.11 |
| Effects and magic | Effects, potions, enchantments, damage types | 0.10 |
| Sound and particles | Sound import, sound events, subtitles, custom particles | 0.10 |
| Progression | Advancements, loot tables (including adding to vanilla tables) | 0.10 |
| | Statistics | 0.12 |
| Text | Lang editor (English) | 0.2 |
| | Multiple languages and a translation view | 0.13 |
| Expert | Networking, key mappings, commands, game rules, resource conditions | 0.12 |
| | Multiblocks, connecting blocks (cables, pipes), fluids | 0.12 |
| | Mixins (guided), access wideners | 0.12 |
| Compatibility | Recipe viewers (EMI, REI, JEI), block info tooltips (Jade), Mod Menu config button | 0.12 |
| | Depending on another mod and its API | 0.12 |
| Testing | Game tests, dedicated server check | 0.12 |
| Collaboration | Local version history | 0.3 |
| | GitHub sync | 0.7 |
| Shipping | Metadata, icon, code and assets licenses, versioned export, release notes | 0.13 |
| | Publishing metadata for Modrinth and CurseForge | 0.13 |

---

## 4. Performance budget

Blocksy must feel fast on an ordinary laptop, not just a gaming PC. All targets are measured on the **reference machine**:

- **CPU:** AMD Ryzen 5 7430U (integrated Radeon graphics, no dedicated GPU)
- **Display:** 4K monitor at the display scaling Liam actually uses
- **Power:** plugged in, default power mode; also spot-check on battery

A 4K screen on integrated graphics is the hard case: a full-resolution 3D canvas pushes about four times the pixels of 1080p. Budgets are proposed starting points; v0.1 records a baseline and they can be tuned in an ADR, never silently.

| What | Target |
| --- | --- |
| Cold start to Home | 2.5 s or less |
| Open a 100-element project | 1 s or less |
| Typing, selecting, clicking anywhere | Visible response within 100 ms |
| Node canvas pan, zoom, drag | 60 fps with 300 nodes; 45 fps or better with 1,000 |
| Model Studio orbit and edit | 60 fps with a 500-cube model at full 4K; 45 fps or better with 2,000 cubes |
| GUI Studio drag at GUI scale 4 | 60 fps |
| Any 3D view when nothing changes | No frames rendered (idle GPU near zero) |
| Full regenerate of 100 elements | 2 s or less (Gradle build time excluded, but always shows progress) |
| Memory with a 100-element project | 600 MB or less |

### 4.1 How it is measured

- `packages/bench` holds fixed benchmark projects and scenes (a 300-node graph, a 500-cube and a 2,000-cube model, a busy GUI, a 100-element mod).
- A `bench` command opens each one in the real Tauri app, runs a scripted interaction, and records frame times (median and 95th percentile), startup time and memory.
- In development, show live stats with `r3f-perf` or `stats-gl` inside 3D views, and use the React Profiler and the webview's dev tools for the rest.
- Results go into `docs/perf/<release>.md` as a table. A regression of more than 10% against the previous release fails the definition of done until fixed or explained in an ADR.

### 4.2 React Three Fiber rules

1. **Render on demand.** Use `frameloop="demand"` and call `invalidate()` on change, so idle 3D views cost nothing.
2. **Cap and adapt pixel ratio.** At 4K, rendering at full device pixel ratio on integrated graphics is the main risk. Cap `dpr` (for example `[1, 1.5]`) and use drei's `PerformanceMonitor` to lower it while orbiting and restore it when still.
3. **Instance repeated geometry.** Cubes share one geometry and use `InstancedMesh` where possible; textures share an atlas with `NearestFilter`.
4. **No React state per frame.** Animate by mutating refs inside `useFrame`; read stores with selectors or transient subscriptions, so dragging a cube never re-renders the panels around it.
5. **Keep panels outside the Canvas.** Outliner, inspector and timelines are normal DOM; only the scene lives in R3F.
6. **Dispose what you create**, and keep post-processing off by default.
7. **Move heavy work off the main thread:** exporting, UV packing and project indexing run in Web Workers.
8. Match the R3F major version to the React version (verify in the v0.1 ADR).

---

## 5. Two looks: Modern and Minecraft

Blocksy ships with two themes, switchable at any time in Settings.

- **Modern (default):** calm, clean, neutral surfaces, soft radii, generous spacing. Built from the inspiration in `docs/design/`.
- **Minecraft:** the whole app reskinned in a playful block style: pixel borders, stone and wood panel tones, chunky buttons, a pixel font.

How it stays maintainable:

- Both themes are **token sets** (colour, radius, border style, shadow, font, sound) over the same components. A theme never changes layout or behaviour.
- The Minecraft theme uses **original** pixel art and an openly licensed pixel font. It must not reuse Mojang's textures or font in the app's own UI.
- The Minecraft theme lands as a baseline in v0.2, so every later component is designed and tested in both themes from day one.

---

## 6. What a real mod contains: Applied Energistics 2

AE2 is a good reference for Aetheric Storage Engineering because both are storage-and-automation mods. It shows that a large mod is mostly **machines, GUIs and data**, not just blocks and items.

From [AE2's repository](https://github.com/AppliedEnergistics/Applied-Energistics-2) and [player guide](https://guide.appliedenergistics.org/1.21/ae2-mechanics/channels):

- It ships a public add-on API and an in-game guidebook, and builds with `gradlew runData build`, so data generation produces its JSON before every build.
- Code, textures and translations have separate licenses; translations come from Crowdin with `%s` placeholders.
- It uses game tests that run in a full game world ([AGENTS.md](https://github.com/AppliedEnergistics/Applied-Energistics-2/blob/main/AGENTS.md)).
- Gameplay is a progression chain: meteorites give quartz and presses, the Inscriber makes processors, processors build the network.

| AE2 feature | What it needs under the hood | Blocksy release |
| --- | --- | --- |
| Quartz ore, meteorites | Ore blocks, worldgen features, structures | 0.10 |
| Energy cell (fullness 1 to 4) | Block states driving model variants | 0.5 |
| Inscriber, Charger | Block entity, inventory, ticking, energy, custom recipe type | 0.8 |
| Machine screens | GUI Studio | 0.9 |
| Storage cells (1k to 256k) | Items carrying data, tooltips | 0.8 |
| ME Drive (10 cells) | Block entity inventory, filtered slots, model per slot | 0.8 |
| Terminals with search | GUI widgets: scroll grid, search, sorting, networking | 0.9, 0.12 |
| Cables and channels | Connecting blocks, graph across blocks, saved world data | 0.12 (with custom code) |
| Controller and Crafting CPU multiblocks | Multiblock shape validation | 0.12 |
| JEI and Jade support | Compatibility modules | 0.12 |
| Guidebook, add-on API | In-game docs, public API | After 1.0 |

Lesson: channels and autocrafting are logic, not content. Blocksy makes content easy and gives a clean place for custom Java where logic gets deep.

---

## 7. What to take from IntelliJ's Minecraft Development plugin

IntelliJ with the [Minecraft Development plugin](https://mcdev.io/) is the standard setup. It supports Fabric, NeoForge, Forge and more, with in-depth support for access transformers, access wideners and NBT files. Fabric's [setup guide](https://wiki.fabricmc.net/tutorial:setup) highlights its project generator, mixin inspections, accessor generation and copying mixin target references.

| IntelliJ feature | Blocksy version | Release |
| --- | --- | --- |
| New project wizard | New project dialog backed by the official template | 0.1 |
| Gradle run configs | Run, Build, Export buttons; data generation runs automatically | 0.1 |
| Generated sources you can click into | Vanilla reference and "make one like this" | 0.7 |
| Translation folding, missing-key inspections ([details](https://deepwiki.com/minecraft-dev/MinecraftDev/6-translation-and-internationalization)) | Lang editor; Problems panel flags missing keys | 0.2, 0.13 |
| Mixin inspections and generators | Guided mixin node with target picker | 0.12 |
| Access wideners and transformers | Generated when a node needs private access | 0.12 |
| NBT support | NBT viewer for structures and saved data | 0.10 |

Cautions: Fabric warns the plugin's default template has used the latest unstable Loom ([setup page](https://wiki.fabricmc.net/es:tutorial:setup)), so Blocksy pins tested versions. Minecraft's source can't be published under the EULA, so it is generated on the user's machine.

---

## 8. Model Studio: Blocksy's own Blockbench-style editor

Model Studio is a boxy 3D model editor built into Blocksy with React Three Fiber, so models, textures and animations never leave the project. It ships in two stages: block and item models in v0.5, entity models and animation in v0.11.

### 8.1 How it is built

Every tool edits one **model document** (cubes, groups or bones with pivots, textures, UVs, animations, plus the format it targets). Exporters turn the document into game files. This is the same rule as the node graph: the document is the only source of truth.

| Part | How it works |
| --- | --- |
| Viewport | R3F scene; each cube is a box with its own UV per face. drei's transform gizmo moves, rotates and scales, snapped to Minecraft's pixel grid. Camera presets (front, side, top, GUI view). |
| Outliner | A tree of groups. In entity models a group is a **bone** with a pivot point, which animations rotate. |
| UV editor | A 2D canvas over the texture where each face's rectangle is dragged and resized; auto-UV and box-UV layouts. |
| Paint on the model | Clicking the model raycasts to the face and texture pixel under the cursor, then paints with the v0.3 texture editor's brushes. |
| Animator (v0.11) | A timeline with keyframes for each bone's rotation, position and scale, easing curves, looping, and live preview in the viewport. |
| Formats | Each format is a registered module with its own rules: block/item models only allow rotations in 22.5° steps on one axis and cubes inside the block space; entity models allow free rotation and bones. The editor warns as you break a rule. |
| Exporters | Block/item model JSON and blockstates; entity model code and animations; `.bbmodel` import and export so people can move between Blockbench and Blocksy. |

### 8.2 Licensing rule

Blockbench's source code is licensed under GPL-3.0, while models people make with it are their own ([Blockbench README](https://github.com/jannisx11/blockbench)). Blocksy must not copy Blockbench code. It can read and write the `.bbmodel` format and learn from how Blockbench behaves, with original code throughout.

### 8.3 Performance

Model Studio follows the React Three Fiber rules in section 4.2 and must hit its budget: 60 fps orbiting a 500-cube model at full 4K on the reference machine, no frames rendered when idle.

---

## 9. The node graph: library choice

**Recommendation: [React Flow](https://reactflow.dev/) (`@xyflow/react`) behind a Blocksy adapter.**

| Library | Status | Fit for Blocksy |
| --- | --- | --- |
| [React Flow](https://reactflow.dev/) | MIT, v12 actively released (12.10.x changelog), shares a headless core with Svelte Flow; used by companies like Stripe | Best fit: React custom nodes, large community, steady maintenance |
| [Rete.js v2](https://retejs.org/docs/) | MIT, TypeScript-first, built-in dataflow and control-flow engines, aims at code generation | Strong alternative if Blocksy wants a built-in execution engine |
| [LiteGraph (Comfy fork)](https://github.com/JasonWeise/litegraph.js) | The standalone fork was archived and merged into ComfyUI's frontend in August 2025 | Avoid: no maintained standalone package |

Rules regardless of library:

- **Blocksy owns the graph model.** Nodes, pins, types and connections live in Blocksy's schema in `packages/core`. The library only draws and edits it, through an adapter.
- **Typed pins** (exec flow vs data; data types like Item, Block, Number, Text, Position) are validated by Blocksy, not the library.
- **Code generation walks Blocksy's model**, never the library's internal state.
- The canvas must meet its performance budget (section 4) with 300 and 1,000 nodes.
- Claude Code verifies current versions and maintenance at the start of v0.4 and records the decision in an ADR.

---

## 10. GUI Studio: the feature that should become a staple

Two ways in, one editor:

1. **Start from vanilla.** Pick a vanilla screen (chest, furnace, crafting table, hopper, dispenser, brewing stand, anvil, smithing table, and more) and iterate on it.
2. **Design from scratch.** A full design canvas with complete control over colour, shape, type and motion, for mods whose screens don't feel like Minecraft at all.

### 10.1 Bringing the real vanilla GUIs in

- Vanilla GUI art is read from the **user's own** Minecraft assets, never shipped with Blocksy.
- Modern Minecraft draws GUI parts as sprites under `textures/gui/sprites`, and a sprite's `.mcmeta` can set scaling to `stretch`, `tile` or `nine_slice` ([NeoForge docs: Screens](https://docs.neoforged.net/docs/1.21.4/gui/screens)). The importer reads that metadata so imported panels resize correctly.
- Slot positions and screen sizes for each vanilla screen are Blocksy-authored **layout data**, not copied from Mojang's code.
- Imported screens open as normal GUI Studio documents, so every custom tool works on them too.

### 10.2 What people building beautiful mod GUIs already use

| Library | What it shows is possible | Loader |
| --- | --- | --- |
| [owo-ui (owo-lib)](https://github.com/RedenMC/owo-lib) | Declarative UI with XML models, templates, blur surfaces and a built-in inspector | Fabric |
| [LDLib2](https://github.com/Low-Drag-MC/LDLib2) | Taffy-powered layout, LSS stylesheets, XML UIs, data binding, and an in-game [UI editor](https://low-drag-mc.github.io/LowDragMC-Doc/ldlib2/ui/editor) with a simulation mode | NeoForge |
| [Modern UI](https://github.com/BloCamLimb/ModernUI-MC) | A full desktop UI framework inside Minecraft: smooth text, true Gaussian blur, animation and transitions | NeoForge, Forge, Fabric |
| AE2 terminals | Dense, searchable item grids with sorting and tabs | NeoForge |

Lessons: designers want stylesheets, declarative layouts, a live inspector with simulation, and motion and blur for a premium feel.

### 10.3 The custom design experience

- **Canvas** on Minecraft's GUI pixel grid, with live previews at GUI scale 1 to 4 and several window sizes.
- **Layers panel**, grouping, alignment, distribution, snapping, rulers, undo history.
- **Components:** panel, image, slot, slot grid, player inventory, button, toggle, slider, text, text field, progress bar and arrow, energy and fluid gauges, item and entity preview, scroll list, item grid, tabs, tooltip.
- **Full style control:** mod-wide colour tokens, fills, gradients, borders, pixel-stepped corner radius, shadows and glow, opacity, custom fonts (TTF through Minecraft's font JSON), nine-slice editor.
- **Stylesheets:** named styles shared across all of a mod's screens, so a redesign is one edit.
- **States and motion:** hover, pressed, disabled, focused; transitions and keyframe animation; animated progress.
- **Data binding:** connect a gauge to a block entity value, a label to a translation, a button to a node graph event.
- **Layout anchors**, a contrast checker, a **simulate mode**, and starter templates ("Vanilla-style machine", "Dark tech terminal", "Magic tome", "Clean modern panel").

### 10.4 How it becomes real code

- A GUI is a **GUI document** of registered components.
- Styles are **baked into nine-slice sprites** where possible, so vanilla's own renderer draws them, fast and compatible.
- Effects vanilla can't draw (gradients at runtime, blur, animation) use a **small Blocksy UI runtime generated into the user's mod as readable source**, not an external dependency.
- Optional owo-ui or LDLib2 output backends are an after-1.0 question that the adapter design allows.

---

## 11. Docs: a calm, visual place to learn

Docs are one of two top-level routes (Home, Docs). They should feel like the best developer docs: calm, clean, and visual first.

### 11.1 Structure (Diátaxis)

[Diátaxis](https://ubuntu.com/blog/diataxis-a-new-foundation-for-canonical-documentation) splits docs into four types that each serve a different need:

| Section | Diátaxis type | Example |
| --- | --- | --- |
| Learn | Tutorial (learning by doing) | "Make your first block" |
| Guides | How-to (solve a task) | "Add a drop to a vanilla loot table" |
| Reference | Reference (look things up) | Every node, element, GUI component and vanilla block |
| Concepts | Explanation (understand why) | "What is a block entity?", "Client vs server" |
| Community | Curated links | Videos, docs, tools and people (11.3) |

### 11.2 Page design

- **Visual first.** Every concept starts with a live demo, then the explanation.
- **Live demos reuse the real editors** in a sandbox: a node canvas you can poke, a 3D block that rotates, a GUI you can click, with the "this node = this code" toggle beside it, like how [react.dev embeds live sandboxes](https://codeSandbox.io/blog/using-sandpack-for-react-libraries-documentation). Every demo has an "Open as project" button. Demos follow the performance rules (render on demand, pause when scrolled out of view).
- **Calm layout:** about 70-character lines, left navigation, "On this page" on the right, generous whitespace, one idea per page.
- **Reference pages are generated** from node and element definitions, so they never drift.
- **Version badge** on every page, like [Fabric's docs](https://docs.fabricmc.net/develop/).
- Learn lessons track progress and can open the guided overlay inside a project; search covers everything.

### 11.3 Community: celebrating the modding world

Every entry credits its creator.

| Category | Starting entries |
| --- | --- |
| Official docs | [Fabric Documentation](https://docs.fabricmc.net/develop/), [Fabric Wiki tutorials](https://wiki.fabricmc.net/tutorial:setup), [NeoForge Documentation](https://docs.neoforged.net/docs/1.21.11/gettingstarted/) |
| Video guides | ModdingByKaupenjoe: Fabric and NeoForge playlists (listed on the [Fabric wiki](https://wiki.fabricmc.net/_export/raw/tutorial:start)) |
| Tools | [Blockbench](https://blockbench.net/wiki/blockbench/formats), [misode's data pack generators](https://minecraft.how/pl/blog/wpis/misode-data-pack-generator), [owo-lib docs](https://docs.wispforest.io/owo/features), [LDLib2 docs](https://low-drag-mc.github.io/LowDragMC-Doc/ldlib2/editor/) |
| Reference | [Minecraft Wiki](https://minecraft.wiki/w/Loot_tables), [AE2 guide](https://guide.appliedenergistics.org/1.21/ae2-mechanics/channels) |
| Communities | Fabric and NeoForge Discord servers, modding subreddits (links to verify before launch) |
| Creator spotlight | A rotating feature on a modder, mod or tool |

Entries live in `packages/docs/community.json` with title, URL, creator, type, loaders, Minecraft versions and a "last checked" date. A link checker runs in CI, and a "Suggest a resource" button opens a GitHub issue template.

---

## 12. Release roadmap

| Release | Name | Proves |
| --- | --- | --- |
| 0.1 | Foundation | Architecture, Modern theme, perf harness, empty mod runs |
| 0.2 | First block | Form-built block, Minecraft theme baseline, Docs shell |
| 0.3 | First item | Textures, recipes, local history |
| 0.4 | Blueprint canvas | Behaviour from nodes |
| 0.5 | Model Studio: blocks and items | 3D model editor, block states |
| 0.6 | Block variety and redstone | Block families, plants, rendering, redstone |
| 0.7 | Docs, learning and GitHub | Visual docs, community, vanilla reference, sync |
| 0.8 | Machines and energy | Block entities, data, energy, custom recipes |
| 0.9 | GUI Studio | Vanilla import and fully custom GUIs |
| 0.10 | Content and world | Tools, armor, worldgen, sounds, advancements |
| 0.11 | Model Studio: entities | Entity models, animation, mobs |
| 0.12 | Expert and compatibility | Multiblocks, networking, fluids, mixins, mod compat |
| 0.13 | Release candidate | Checks, translations, publishing, polish |
| 1.0.0 | The real test | Block, item, full mod |

When each v1.0 test first becomes passable: **item** from 0.4, **block** from 0.5, **full mod** from 0.12.

Every `/goal` prompt keeps `CHECKPOINT.md` up to date (so a new session can continue) and ends with a STATUS / CHECKS / NEEDS YOUR DECISION report, so the output only needs pasting back when something fails.

---

## 13. Releases in detail

### v0.1 Foundation

- Monorepo per section 2.3; registries for elements, nodes, GUI components, model formats, Model Studio tools, targets, themes and demos
- Project file with `formatVersion`, a migration runner, and a command system with undo/redo
- Pure generator engine with golden tests; Fabric target module
- Design system: tokens, Modern theme, base components
- App shell: app rail (Home, Docs, settings gear), header, status bar, bottom panel with Build log (redesigned 2026-10-30: borderless icon rail with Home and Docs, projects only on Home, Build log and status bar only on the project page)
- Home with recent projects; New project dialog (Empty mod)
- JDK detection and setup screen; official Fabric template with pinned versions
- Run (`runClient`), Build, Export jar; first-build progress screen
- tauri-specta bindings with the `AppError` contract and typed events (2.5)
- Auto-updater, GitHub Action release pipeline and the `/release` command (2.6)
- Performance harness (`packages/bench`) with a baseline recorded on the reference machine
- First ADRs in `docs/decisions/` (stack and versions, monorepo, registries, R3F and React versions)

**Done when:** a new empty mod launches from Run, a dummy element type can be added with one folder plus one registration line, the baseline is in `docs/perf/0.1.md`, and an installed 0.1.0 updates itself to a test 0.1.1 release.

```text
/goal Build Blocksy v0.1 "Foundation". Read docs/release/blocksy-release-plan.md sections 1, 2, 4 and 5 first, and look at docs/design/ for the UI feel.
Scope: the pnpm-workspaces monorepo layout from section 2.3; registries for element types, node types, GUI components, model formats, Model Studio tools, loader targets, themes and docs demos; a versioned project file with a migration runner and a command system with undo/redo; a pure generator engine with golden-file tests; a Fabric target module using the official template with pinned, tested Loom and Fabric API versions; a token-based design system with the Modern theme; app shell (app rail with Home, Docs, settings gear; header; status bar; bottom panel with Build log); Home with recent projects; New project dialog (Empty mod: name, location, derived mod ID, Minecraft version); JDK detection and setup screen; Run (runClient), Build and Export jar; a first-build progress screen streaming Gradle output; Settings (Java path, default folder, theme); tauri-specta bindings generated into apps/desktop/src/shared/bindings.ts with an AppError { code, message } contract, a snake_case ErrorCode enum and typed events, plus a lint rule that forbids calling invoke directly (section 2.5); the Tauri updater plugin with signed updates checked from GitHub Releases, a quiet "ready, restart to update" note, and no install while Gradle or Minecraft is running; a GitHub Action that builds installers on a version tag and attaches the signed update manifest to a draft release; a pnpm release script and .claude/commands/release.md (section 2.6; the signing key stays in .private/, which must be git-ignored); the performance harness in packages/bench with a bench command that records startup time, frame times (median and p95) and memory, and writes docs/perf/0.1.md. Add lint import boundaries and write ADRs for the stack and versions (including matching React Three Fiber to the React version), monorepo and registry design.
Out of scope: blocks, items, nodes, 3D views, NeoForge, GitHub sign-in.
Rules: never bundle Minecraft code or assets. Keep code small and commented, and explain each piece to me as you build it. I will run the bench on my reference machine (Ryzen 5 7430U, integrated graphics, 4K monitor); make it one command.
Done when: an empty mod launches from Run and shows in the mod list, a dummy element type can be added by creating one folder plus one registration line (proven by a test), cold start meets the section 4 budget, the baseline is recorded, and an installed 0.1.0 updates itself to a test 0.1.1 release.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.2 First block

- Block element module: name, hardness, blast resistance, tool, light, sound, map colour
- Project sidebar tree; 16×16 texture import with a live R3F block preview (render on demand)
- Generated Java registration, blockstate, models, loot table, lang entry
- Creative tab element; read-only Code tab
- **Minecraft theme baseline:** token set, original pixel-art panels and buttons, open-licensed pixel font
- Docs shell with Learn, Guides, Reference, Concepts, Community sections and the first tutorial
- Starter block in the New project dialog
- **The project editor** (first appears here, every later editor lives in it): see "Project editor layout" below

#### Project editor layout

Decided 2026-10-30 (Liam). The app's main face stays calm: the icon rail (Home, Docs) and Home with the project grid, nothing else. Working on a mod happens on its own page.

- **Its own route per project.** Clicking a project on Home opens `/project/<id>`, a separate full-page editor for that one project. Projects are not listed in the app sidebar; you focus on one project at a time and go back to Home to switch.
- **Calm, canvas first.** Study visual editors that stay quiet (Figma UI3, Spline, Framer, Feather) and avoid the noise of MCreator's dense toolbars and nested panels. Rules:
  - The work (block preview, node canvas, model, GUI) fills the page. Tools float above it as small rounded **islands** (a bottom toolbar, a panel beside the selection), slightly translucent, never fixed walls of panels.
  - One quiet left column for the project tree (elements by type), collapsible. The inspector for the selection floats on the right and only appears when something is selected.
  - No borders: separate areas with space and soft surfaces, as on Home. Every icon button has a tooltip and a label somewhere (Feather is criticised for obscure icons).
  - Build, Run and Export sit in the project's titlebar row, as in v0.1.
- **The status bar lives only here**, as plain text and icons (VS Code / macOS menu bar style, no pills): loader and version, Java, build and game state, update note, Build log toggle. Home and Docs have none.
- **Project overview page.** The v0.1 project details screen (mod ID, Java package, Minecraft, loader, Java, folder) moves into the editor as its own "Overview" page in the project tree, not the first thing you see when opening a project.
- The same layout hosts Model Studio (0.5), the Blueprint canvas (0.4) and GUI Studio (0.9) as pages of the project.

**Done when:** the block shows in its creative tab, places, and drops itself with the right tool; opening a project from Home shows the project editor with the status bar; every screen works in both themes.

```text
/goal Build Blocksy v0.2 "First block" on top of v0.1. Follow docs/release/blocksy-release-plan.md sections 2 and 4.
Scope: a Block element module (schema, editor panel, templates, Docs reference page, tests) with name, hardness, blast resistance, required tool, light level, sound type and map colour; project sidebar tree; 16x16 PNG texture import with a live React Three Fiber block preview that renders on demand; generated Java registration plus blockstate, block and item models, loot table and lang entry (prefer Fabric data generation); a Creative tab element; a read-only Code tab; the Minecraft theme baseline as a token set with original pixel-art assets and an openly licensed pixel font (no Mojang textures or font in the app UI); the Docs shell with Learn, Guides, Reference, Concepts and Community sections plus a "Make your first block" tutorial; the Starter block option in New project; the project editor from "Project editor layout" in v0.2 of the plan (a separate route per project opened from Home, canvas first with floating islands, a collapsible project tree, a floating inspector, no borders, the status bar as plain text and icons only on this page, and the v0.1 project details as an Overview page inside it).
Out of scope: items, recipes, nodes, custom models.
Done when: the block shows in its creative tab, can be placed, drops itself when mined with the right tool, every screen works in both themes, the bench passes, and no v0.1 module was refactored.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.3 First item, textures and recipes

- Item element: stack size, rarity, fire resistance, food, fuel, compostable, tooltips
- Pixel texture editor: pencil, fill, picker, mirror, palette, onion skin, animated `.mcmeta`
- Recipe editor with a visual crafting grid: shaped, shapeless, smelting, blasting, smoking, stonecutting
- Tags editor; lang editor
- Local version history (Save version = git commit, History tab)
- Starter item in the New project dialog

**Done when:** an item is crafted, cooked in a furnace and eaten.

```text
/goal Build Blocksy v0.3 "First item, textures and recipes" on top of v0.2, following docs/release/blocksy-release-plan.md sections 2 and 4.
Scope: an Item element module (stack size, rarity, fire resistance, food with hunger/saturation/effects, fuel time, compost chance, tooltips); a pixel texture editor (pencil, fill, picker, mirror, palette, onion skin, animated textures with .mcmeta) built as reusable brushes, because Model Studio will paint on 3D models with them in v0.5; a recipe editor with a visual crafting grid for shaped, shapeless, smelting, blasting, smoking and stonecutting; a tags editor; a lang editor; local version history (Save version = git commit, History tab); the Starter item option. Every new component in both themes, every element with its Docs page and demo.
Out of scope: nodes, GitHub sync, custom models.
Done when: an item is crafted from its recipe, cooked in a furnace and eaten in game, the bench passes, and no earlier module was refactored.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.4 Blueprint canvas

- Node canvas through the graph adapter (React Flow recommended, section 9): pan, zoom, minimap, search-to-add, groups, comments
- Blocksy-owned graph model with typed exec and data pins
- Event, logic and action node families, each as registered modules
- Live "this node = this code" preview and "Learn more" links
- Validation on the canvas and in Problems; Custom code node

**Done when:** right-clicking the block plays a sound, spawns particles and gives an item, built only from nodes; the canvas hits 60 fps with 300 nodes on the reference machine.

```text
/goal Build Blocksy v0.4 "Blueprint canvas" on top of v0.3. Read docs/release/blocksy-release-plan.md sections 2, 4 and 9 first.
Scope: first verify current versions and maintenance of React Flow (@xyflow/react) and Rete.js v2, then record the choice in an ADR (React Flow is the recommendation). Build a Blocksy-owned graph model in packages/core (nodes, typed exec and data pins, connections) with the library behind an adapter, so swapping libraries never touches node modules. Canvas: pan, zoom, minimap, search-to-add menu, groups, comments. Node families as registered modules: events (block used/placed/broken/stepped on, item used, entity hit, tick), logic (if, compare, random chance, math, variables, bounded loops), actions (play sound, spawn particle, give/take item, set block, apply effect, damage, message player, explode). Each node: one commented code template, Docs page, example graph, golden test. Inspector shows live "this node = this code" Java and a Learn more link. Validation on canvas and in Problems. Custom code node. Add 300-node and 1,000-node graphs to the bench.
Done when: right-clicking the block plays a sound, spawns particles and gives the player an item, built only from nodes; the adapter has a test proving node modules never import the library; the canvas meets the section 4 budget.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.5 Model Studio: blocks and items

Everything in section 8.1 except the animator and entity format.

- Model document in `packages/model-studio`; block/item format module with its rules
- R3F viewport with gizmo, pixel snapping, camera presets; outliner; UV editor
- Paint on the model with the v0.3 brushes
- Display settings (GUI, hand, head, ground); block states editor with a model per state; collision shapes from the model
- `.bbmodel` import and export; nodes that read and set states
- Reload textures and models in a running game
- **Floating islands** layout inside the project editor (see v0.2 "Project editor layout"), see below

#### Model Studio look (decided 2026-10-30)

Calm and professional, like Feather 3D: the 3D viewport fills the page and every tool floats above it as a soft rounded island. Reference: `docs/design/visual-editor(assets).jpg`.

- **Islands:** scene outliner (Scene / Assets tabs, camera and lights, objects with lock/hide/focus on hover); inspector cards with a heading and `+` (Backgrounds, Camera Isometric/Perspective with distortion, Show frame, Artboard size); a Materials and Assets browser as a grid of large rounded thumbnails; a project card with the model name and type.
- Segmented controls for modes (Design / Animation in 0.11), switches for toggles, number fields with units, light surfaces, generous padding, no hard borders.
- Islands collapse and can be hidden (Tab) so the model has the whole screen; positions are remembered per project.

**Done when:** a directional lamp with a custom model faces the player and lights up when powered, and orbiting a 500-cube model holds 60 fps at full 4K on the reference machine.

```text
/goal Build Blocksy v0.5 "Model Studio: blocks and items" on top of v0.4. Read docs/release/blocksy-release-plan.md sections 2, 4 and 8 first.
Scope: a model document in packages/model-studio (cubes, groups, textures, UVs, target format) edited only through commands; the block/item format as a registered module enforcing Java model rules (22.5 degree rotation steps on one axis, cubes inside block space) with live warnings; a React Three Fiber viewport following every rule in section 4.2 (frameloop demand, capped and adaptive dpr with drei PerformanceMonitor, instanced cubes, texture atlas with NearestFilter, no React state per frame, panels outside the Canvas); drei transform gizmo snapped to the pixel grid; camera presets; an outliner; a UV editor with auto-UV; painting on the model by raycasting to the face and texel, reusing the v0.3 brushes; display settings (GUI, hand, head, ground); a block states editor (facing, lit, powered, waterlogged, custom numeric) with a model per state; collision and outline shapes from the model; .bbmodel import and export (original code only, Blockbench is GPL-3.0); nodes that read and set states; reloading textures and models in a running game; the calm floating-islands look from "Model Studio look" in v0.5 of the plan (viewport fills the page, outliner, inspector cards and a materials/assets grid as soft rounded islands, as in docs/design/visual-editor(assets).jpg and Feather 3D). Add 500-cube and 2,000-cube models to the bench.
Out of scope: entity format, bones, animation.
Done when: a directional lamp with a custom model faces the player when placed and lights up when powered, and the viewport meets the section 4 budget at full 4K.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.6 Block variety and redstone

- Block families: slabs, stairs, walls, fences, fence gates, doors, trapdoors, buttons, pressure plates, pillars
- Rendering: transparent and cutout layers, tinting, emissive textures
- Plants: crops with growth stages, flowers, saplings and trees (tree shapes; worldgen placement in 0.10)
- Behaviour: falling blocks, ores that drop XP, redstone emit and receive, comparator output
- "Make a full set" helper: one material creates its block, slab, stairs, wall and recipes

**Done when:** a "full set" from one new stone works in game (slab, stairs, wall, door), a crop grows and can be harvested, and a block lights a redstone lamp.

```text
/goal Build Blocksy v0.6 "Block variety and redstone" on top of v0.5, following docs/release/blocksy-release-plan.md sections 2, 3 and 4.
Scope: block family element modules (slabs, stairs, walls, fences, fence gates, doors, trapdoors, buttons, pressure plates, pillars) that reuse the v0.2 block module through its public interface; render layers (transparent, cutout), block tinting and emissive textures; plants (crops with growth stages, flowers, saplings and tree shapes); falling blocks; ores that drop XP; redstone emit and receive nodes and comparator output; a "Make a full set" helper that creates a material's block, slab, stairs, wall and their recipes. Each with Docs pages, demos and golden tests; all catalog items for 0.6 in section 3 done.
Done when: a full set from one new stone works in game, a crop grows and can be harvested, and a block powers a redstone lamp.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.7 Docs, learning and GitHub

- Full Docs per section 11: Diátaxis sections, calm layout, search, version badges
- Live demo system reusing real editors in sandbox mode, with "Open as project"
- Reference pages generated from node and element definitions
- Community section from `community.json`, link checker in CI, "Suggest a resource"
- Vanilla reference: index Minecraft's blocks, items and recipes from the user's generated sources; "Make one like this"
- Learn mode overlay
- GitHub: device-code sign-in, create repo, clone, push, pull, branches, plain-language conflict screen; Import existing

**Done when:** a beginner completes "Make your first block" using live demos, makes a furnace-like block from the vanilla reference, and pushes it to a new GitHub repo.

#### GitHub sign-in (device flow)

Blocksy has no server, so it signs in with GitHub's device flow, which needs no client secret.

- **How it feels:** the user clicks Sign in with GitHub. Blocksy shows a short code, copies it to the clipboard and opens github.com/login/device. They paste, approve, and Blocksy finishes on its own. No typing, no copying URLs back.
- **Behind the scenes:** Rust requests a device code, then polls GitHub at the interval it gives, backing off when told to slow down. It shows clear states: waiting, approved, denied, expired (with a Try again button).
- **Token storage:** in the OS keychain (Windows Credential Manager, macOS Keychain), never in a file, the project, settings or logs. The frontend never sees the token; it only gets the signed-in user's name and avatar.
- **Permissions:** ask only for what Blocksy needs: read the user's profile and create and push to their repositories. Decide OAuth App scopes vs a GitHub App with fine-grained permissions in an ADR.
- **Git operations:** push and pull over HTTPS using the token from the keychain, passed per operation. Never write the token into a remote URL or git config.
- **One door:** sign-in sits behind a few Rust commands (`githubSignIn`, `githubSignOut`, `githubAccount`) and typed events, so it can switch to a browser-callback flow later (if Blocksy ever has its own server) without touching the rest of the app.
- **Sign out** deletes the token from the keychain and asks GitHub to revoke it.
- **Errors** use the `AppError` contract with codes like `github_denied`, `github_expired` and `github_offline`, shown in plain language.

#### Sign-in window (decided 2026-10-30)

Sign-in opens in **its own small Tauri window**, separate from the main window, styled after `docs/design/login-screen.jpg`:

- A rounded card over a soft, blurred backdrop. Left half: a large picture, using Blocksy's generated pixel cover art (never Mojang art, rule 10). Right half: a small "Back", "Sign in to" over a large calm headline, the GitHub device-flow steps (the code, copied, and an "Open GitHub" button), and the Blocksy mark with a one-line tagline at the bottom.
- The window closes on its own when sign-in finishes, and the main window shows the signed-in avatar where the settings gear sits.


```text
/goal Build Blocksy v0.7 "Docs, learning and GitHub" on top of v0.6. Read docs/release/blocksy-release-plan.md sections 4 and 11 and the docs/design/ inspiration first.
Scope: the full Docs experience organised by Diataxis (Learn, Guides, Reference, Concepts, Community) with a calm layout (about 70 character lines, left nav, On this page, generous whitespace), search and version badges; a live demo system that embeds real Blocksy editors in a sandbox with an "Open as project" button, registered through the demos registry, rendering on demand and pausing when scrolled out of view; reference pages generated from node and element definitions; a Community section driven by packages/docs/community.json (title, URL, creator credit, type, loaders, versions, last checked) seeded from section 11.3, with a CI link checker and a Suggest a resource issue template; a vanilla reference that indexes blocks, items and recipes from sources generated on the user's machine (never shipped) with "Make one like this"; a Learn mode overlay; GitHub integration following the "GitHub sign-in (device flow)" section of v0.7 in the plan (device flow with the code copied and the browser opened for the user, token only in the OS keychain and never sent to the frontend, minimal permissions recorded in an ADR, token passed per git operation and never written to remotes or config, sign-in behind githubSignIn/githubSignOut/githubAccount commands and typed events, shown in its own small window styled after docs/design/login-screen.jpg as described in "Sign-in window" in v0.7 of the plan), plus create repo, clone, push, pull, branches and a plain-language conflict screen and Import existing.
Done when: a beginner finishes "Make your first block" using live demos, builds a furnace-like block from the vanilla reference, and pushes it to a new GitHub repo; a Docs page with three live demos still scrolls at 60 fps on the reference machine.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.8 Machines and energy

- Block entity element: stored values, slot types (input, output, fuel, filtered), ticking, saved data, data attachments
- Items carrying data (data components) with dynamic tooltips
- Energy storage and transfer; item transfer between blocks (hoppers, pipes, sided I/O)
- Custom recipe types with their own recipe editor
- Basic block entity renderers
- A simple auto-generated screen per machine behind a GUI interface (replaced by GUI Studio in 0.9 without changing the machine module)

**Done when:** a powered crusher takes ore, uses energy from a generator, shows progress, outputs dust from a custom recipe, keeps its contents after reload and works with hoppers.

```text
/goal Build Blocksy v0.8 "Machines and energy" on top of v0.7, following docs/release/blocksy-release-plan.md sections 2, 3 and 4.
Scope: a Block entity element module (stored values; input, output, fuel and filtered slots; ticking; saving to the world; data attachments); items with data components and dynamic tooltips; energy storage and transfer between blocks (verify the current standard Fabric energy API and record it in an ADR); item transfer with sided input and output for hoppers and pipes; custom recipe types with a recipe editor; basic block entity renderers; a simple auto-generated screen per machine exposed through a GUI interface, so GUI Studio in v0.9 can replace it without editing the machine module. Use AE2's Inscriber as a structural reference only; write original code.
Done when: a powered crusher takes ore, draws energy from a generator, shows progress, outputs dust from a custom recipe, keeps its contents after a world reload, and works with hoppers.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.9 GUI Studio

Everything in section 10.

- Vanilla import from the user's local assets, honouring sprite scaling; Blocksy-authored layout data
- Design canvas on the GUI pixel grid, GUI scale 1 to 4 previews, layers, alignment, snapping
- GUI component modules; style engine with tokens, gradients, fonts, nine-slice and stylesheets
- States, transitions and keyframe animation; data binding to block entity values and node events
- Simulate mode; contrast checker; starter templates
- Output: nine-slice sprites plus a small readable Blocksy UI runtime generated into the mod

**Done when:** the vanilla furnace screen is re-skinned for the crusher, and a fully custom "Aetheric terminal" with gradient panels, a custom font, animated progress and a scroll grid works in game at every GUI scale.

```text
/goal Build Blocksy v0.9 "GUI Studio" on top of v0.8. Read docs/release/blocksy-release-plan.md sections 4 and 10 and every image in docs/design/ first. This feature should be good enough to become the reason people use Blocksy.
Scope: vanilla screen import that reads GUI sprites and their .mcmeta scaling (stretch, tile, nine_slice) from the user's local Minecraft assets (never shipped) plus Blocksy-authored layout data for common vanilla screens; a GUI document model in packages/gui-studio; a design canvas on the GUI pixel grid with GUI scale 1 to 4 and window-size previews, layers, alignment, distribution, snapping and undo; GUI components as registered modules (panel, image, slot, slot grid, player inventory, button, toggle, slider, text, text field, progress bar and arrow, energy and fluid gauges, item and entity preview, scroll list, item grid, tabs, tooltip); a style engine (mod colour tokens, fills, gradients, borders, pixel-stepped radius, shadows, glow, opacity, custom TTF fonts via font JSON, nine-slice editor, shared stylesheets); states (hover, pressed, disabled, focused), transitions and keyframe animation; data binding to block entity values, translations and node events; a simulate mode; a contrast checker; starter templates. Output: bake styles into nine-slice sprites where possible and generate a small, readable, commented Blocksy UI runtime into the mod for gradients, blur and animation (no external dependency). Study owo-ui, LDLib2 and Modern UI for ideas; write original code. Connect machine screens from v0.8 through the existing GUI interface without editing the machine module.
Done when: the vanilla furnace screen is re-skinned for the crusher, a fully custom "Aetheric terminal" with gradient panels, a custom font, animated progress and a scroll grid works in game at every GUI scale, and dragging on the canvas holds 60 fps at GUI scale 4 on the reference machine.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.10 Content and world

- Tools and tool materials, armor with armor layers, shields
- Bows and crossbows, throwables, buckets, music discs
- Effects, potions, enchantments, damage types
- Sounds (`.ogg`, events, subtitles) and particles
- Advancements editor with a tree view; loot tables including vanilla injection
- Worldgen: ores, features and tree placement with a height and rarity preview; NBT structures with an NBT viewer; biomes; dimensions
- Villager professions and trades
- Mod config with a settings screen designed in GUI Studio

**Done when:** a new ore generates in fresh worlds, mining it grants an advancement, its pickaxe and armor set work, and a custom villager trades the refined item.

```text
/goal Build Blocksy v0.10 "Content and world" on top of v0.9, following docs/release/blocksy-release-plan.md sections 2, 3 and 4.
Scope: element modules for tools and tool materials, armor (with armor layer textures), shields, bows and crossbows, throwables, buckets, music discs, effects, potions, enchantments, damage types, sounds (.ogg import, sound events, subtitles), custom particles, advancements (tree view editor), loot tables (including injecting into vanilla tables), worldgen ores, placed features and tree placement (height and rarity preview), NBT structures with an NBT viewer, biomes, dimensions, villager professions and trades, and a mod config whose settings screen is designed in GUI Studio. Use data generation for all JSON. Each with Docs pages, demos and golden tests; all catalog items for 0.10 in section 3 done.
Done when: a new ore generates in a fresh world, mining it grants an advancement, its pickaxe and armor set work, and a custom villager trades the refined item.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.11 Model Studio: entities and animation

The second half of section 8.

- Entity format module: bones with pivots, free rotation, texture size rules
- Animator: timeline, keyframes for rotation, position and scale per bone, easing, looping, live preview
- Armor models on the player
- Entity element: attributes, AI goals, spawn rules and eggs, renderers, projectiles
- Animations driven by node events (walk, attack, idle)
- Entity model code and animation export; `.bbmodel` entity import

**Done when:** a custom animated mob spawns naturally, walks and attacks with its own animations, and drops loot; the animator plays a 2,000-cube rig at 45 fps or better on the reference machine.

```text
/goal Build Blocksy v0.11 "Model Studio: entities and animation" on top of v0.10. Read docs/release/blocksy-release-plan.md sections 4 and 8 first.
Scope: an entity model format module (bones with pivots, free rotation, texture size rules) added to Model Studio without editing the block/item format or existing tools; an animator tool (timeline, keyframes for rotation, position and scale per bone, easing curves, looping, live viewport preview that mutates refs in useFrame, never React state); armor models on the player; an Entity element module (attributes, AI goals, spawn rules, spawn eggs, renderers, projectiles); animations triggered by node events (idle, walk, attack); entity model code and animation export; .bbmodel entity import. Original code only. Add an animated rig to the bench.
Done when: a custom animated mob spawns naturally, walks and attacks with its own animations, and drops loot, and the animator meets the section 4 budget.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.12 Expert tools and compatibility

- Networking generated from nodes; key mappings; commands; game rules; statistics; resource conditions
- HUD overlays designed in GUI Studio
- Multiblock helper; connecting blocks with connected models; fluids with storage and transfer
- Guided mixin node, access wideners
- Compatibility: recipe viewers (EMI, REI, JEI), Jade tooltips, Mod Menu config button, depending on another mod's API
- Game tests, dedicated server check, code hotswap

**Done when:** a storage controller multiblock forms, cables connect to it, the Aetheric terminal searches items from connected storage, and the crusher's recipes appear in a recipe viewer; the mod runs on a dedicated server.

```text
/goal Build Blocksy v0.12 "Expert tools and compatibility" on top of v0.11, following docs/release/blocksy-release-plan.md sections 2, 3 and 4.
Scope: server-to-client networking generated as packets from nodes; key mappings; commands; game rules; statistics; resource conditions; HUD overlays designed in GUI Studio; a multiblock helper (shape definition, validation, form and break events); connecting blocks with connected models; fluids with storage and transfer; a guided mixin node with target picker; access wideners; compatibility modules for recipe viewers (EMI, REI, JEI), Jade block info and the Mod Menu config button, each optional and loaded only when that mod is present; adding another mod as a dependency and using its API; Fabric game tests; a dedicated server run check; code hotswap while the game runs. All as registered modules with Docs and demos; all catalog items for 0.12 in section 3 done.
Done when: a storage controller multiblock forms, cables connect to it, the v0.9 Aetheric terminal lists and searches items from connected storage, the crusher's recipes appear in a recipe viewer, and the mod runs on a dedicated server.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

### v0.13 Release candidate

- Whole-mod Problems checks: missing textures, lang keys, loot tables, uncraftable recipes, unused elements, low-contrast GUIs
- Friendly build errors and a crash log reader linking to the element at fault
- Multiple languages with a translation view
- Metadata, icon, code and assets licenses, dependencies; versioned export; release notes; Modrinth and CurseForge publishing metadata
- Performance pass on 100+ element projects; autosave and crash recovery
- Both themes polished end to end; every Docs page complete; architecture audit

**Done when:** a 100-element test project builds with zero Problems, meets every performance budget, and its jar runs in a normal Fabric install.

```text
/goal Build Blocksy v0.13 "Release candidate" on top of v0.12.
Scope: whole-mod Problems checks (missing textures, lang keys, loot tables, uncraftable recipes, unused elements, low-contrast GUIs); friendly build errors and a crash log reader linking to the element at fault; multiple languages with a translation view; a mod metadata editor (icon, description, authors, separate code and assets licenses, dependencies); versioned jar export with release notes from history; Modrinth and CurseForge publishing metadata; a performance pass on 100+ element projects against every budget in docs/release/blocksy-release-plan.md section 4; autosave and crash recovery; a polish pass on both themes; finish every Docs page and demo. Audit the codebase against section 2 and section 3 and list any rule violations or missing catalog items with fixes.
Done when: a 100-element test project builds with zero Problems, meets every section 4 budget on the reference machine, and its jar runs in a normal Fabric install outside Blocksy.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

---

## 14. v1.0.0: the real test

v1.0.0 ships when all three tests pass inside Blocksy with no hand-edited files outside it, on the reference machine, within the performance budget. Custom code nodes are allowed for the full mod.

**Test 1: a block** (target: under 15 minutes for a first-time user)
- [ ] Custom texture and model with a facing state
- [ ] Correct tool and hardness; drops itself
- [ ] Recipe and creative tab; translated name; zero Problems

**Test 2: an item**
- [ ] Texture from the texture editor
- [ ] Recipe plus node-based behaviour (for example a right-click ability with a cooldown)
- [ ] Tooltip and lang entry

**Test 3: a full mod, an Aetheric Storage Engineering slice**
- [ ] An ore with worldgen, plus raw and refined items, and a full block set from the refined material
- [ ] A tool and armor set from the new material
- [ ] Two machines powered by energy, with GUI Studio screens (one vanilla-style, one fully custom) and a custom recipe type
- [ ] A storage item that carries data, shown in its tooltip
- [ ] A small multiblock with cables connecting the machines
- [ ] An animated entity made in Model Studio (for example a storage drone)
- [ ] Recipes visible in a recipe viewer
- [ ] An advancement chain guiding progression
- [ ] Config screen and mod icon
- [ ] Pushed to GitHub; release jar runs in a normal Fabric install and on a dedicated server
- [ ] The whole project works and looks right in both app themes

```text
/goal Ship Blocksy v1.0.0 by passing three acceptance tests, building everything inside Blocksy with no hand-edited files outside it. Read docs/release/blocksy-release-plan.md sections 3, 4 and 14.
Test 1 (block): custom texture and model with a facing state, correct tool and hardness, drops itself, recipe, creative tab, translated name, zero Problems.
Test 2 (item): texture from the texture editor, recipe, node-based right-click ability with a cooldown, tooltip and lang entry.
Test 3 (full mod, an Aetheric Storage Engineering slice): ore with worldgen, its items and a full block set; tool and armor set; two energy-powered machines with GUI Studio screens (one vanilla-style, one fully custom) and a custom recipe type; a data-carrying storage item; a small multiblock with cables; an animated entity made in Model Studio; recipes visible in a recipe viewer; an advancement chain; config screen and icon; pushed to GitHub; release jar running in a normal Fabric install and on a dedicated server.
For every gap a test exposes, fix Blocksy itself (never the test project), log each fix, and confirm no fix required refactoring an earlier module; if one did, write an ADR. Run the full bench and record docs/perf/1.0.0.md.
Done when: all three tests pass from a fresh install of Blocksy on the reference machine within every section 4 budget.
Keep CHECKPOINT.md current as you go (same shape as earlier releases: done table, still to do, useful facts), so a new session can pick up where the last one stopped.
Before finishing: run /code-review and /security-review on the release branch and fix what they find, and run the end-to-end test (create a project in the real app, Build, Run, and check the release's "Done when" in game).
End with STATUS / CHECKS / NEEDS YOUR DECISION.
```

---

## 15. After 1.0 and risks

After 1.0: NeoForge as a second target module, more Minecraft versions with a porting assistant, optional owo-ui or LDLib2 GUI backends, an in-game guidebook, a public add-on API, and community templates, node packs, model packs and GUI themes.

| Risk | What happens | Fallback |
| --- | --- | --- |
| Minecraft updates break templates | Generated code goes stale | Pin one version per release; one small template per node, so porting is a checklist |
| Architecture drift | Features start needing refactors | Definition of done (2.4), lint boundaries, ADRs, audit in 0.13 |
| 3D is slow at 4K on integrated graphics | Model Studio feels laggy | R3F rules (4.2), adaptive pixel ratio, bench on every release |
| GUI Studio or Model Studio scope explodes | 0.9 or 0.11 never ends | Ship the listed set first; extras become modules later |
| Generated Java is unreadable | Learning goal fails | Review generator output every release as if teaching it |
| First build too slow or fails | Beginners quit at step one | Progress screen, cached downloads, plain-language errors (0.1) |
| Node library loses maintenance | Canvas stuck on old code | Graph model owned by Blocksy; library behind an adapter (section 9) |
| Community links rot | Docs feel abandoned | CI link checker and "last checked" dates (11.3) |
| Updater signing key lost or leaked | Installs can't update, or a fake update could be signed | Key outside the repo, password in a password manager and Actions secrets, offline backup |
| An update breaks people's projects | Users lose trust | Project migrations with tests; never install mid-build; changelog Known issues |

**Open question:** is Aetheric Storage Engineering planned for Fabric? If it must be NeoForge, the NeoForge target moves before 1.0. The target-module design makes that a new module, not a rewrite.

---

## Sources

- [Applied Energistics 2 repository](https://github.com/AppliedEnergistics/Applied-Energistics-2), [AGENTS.md](https://github.com/AppliedEnergistics/Applied-Energistics-2/blob/main/AGENTS.md), [guide: Channels](https://guide.appliedenergistics.org/1.21/ae2-mechanics/channels)
- [Fabric developer guides](https://docs.fabricmc.net/develop/), [Fabric wiki setup](https://wiki.fabricmc.net/tutorial:setup), [Fabric wiki tutorials and YouTube list](https://wiki.fabricmc.net/_export/raw/tutorial:start)
- [NeoForge docs: Screens and GUI sprite scaling](https://docs.neoforged.net/docs/1.21.4/gui/screens), [NeoForge getting started](https://docs.neoforged.net/docs/1.21.11/gettingstarted/)
- [Minecraft Development plugin](https://mcdev.io/), [MinecraftDev translation system](https://deepwiki.com/minecraft-dev/MinecraftDev/6-translation-and-internationalization)
- [Blockbench repository and license](https://github.com/jannisx11/blockbench), [Blockbench format features](https://blockbench.net/wiki/blockbench/formats)
- [owo-lib](https://github.com/RedenMC/owo-lib), [LDLib2](https://github.com/Low-Drag-MC/LDLib2), [LDLib2 UI editor](https://low-drag-mc.github.io/LowDragMC-Doc/ldlib2/ui/editor), [Modern UI for Minecraft](https://github.com/BloCamLimb/ModernUI-MC)
- [React Flow](https://reactflow.dev/), [Rete.js docs](https://retejs.org/docs/), [LiteGraph Comfy fork (archived)](https://github.com/JasonWeise/litegraph.js)
- [Diátaxis at Canonical](https://ubuntu.com/blog/diataxis-a-new-foundation-for-canonical-documentation), [Sandpack for docs](https://codeSandbox.io/blog/using-sandpack-for-react-libraries-documentation)
- [misode generators overview](https://minecraft.how/pl/blog/wpis/misode-data-pack-generator)
