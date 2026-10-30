# 0006: Loader code for elements lives in the target; Fabric data generation

- Status: accepted
- Date: 2026-10-30

## Context

v0.2 adds the first real element types (Block, Creative tab). Two questions came up:

1. Where does the Fabric Java for a block go? The element package should hold the
   element's templates (plan 2.1), but rule 5 says only `packages/targets/*` may name
   Fabric, and ADR 0003 says a new loader must add templates without touching elements.
2. A block's pieces land in **shared** files: one `ModBlocks.java`, one data generator,
   one `en_us.json`, a line in `onInitialize`. Per-element templates can't each own those
   (the generator rightly fails when two templates write the same file).

The user also asked to prefer Fabric data generation over hand-written JSON.

## Decision

- `LoaderTarget` gains two **optional** fields (registry shapes only grow by optional fields):
  - `adapters: Record<elementTypeId, template>`: the loader's code for each element type.
    The generator uses `type.templates[target.id] ?? target.adapters[type.id]` (one line).
  - `prepareTasks(project)`: build tasks to run before Build/Run (Fabric: `runDatagen`
    once the mod has blocks).
- Element packages keep everything loader-neutral: schema, defaults, editor panel, canvas,
  docs data (`ElementType.docs`), tests. `ElementType.templates` stays `{}` for them.
- The Fabric target collects element pieces into shared files itself
  (`templates/content.ts`: ModBlocks, ModCreativeTabs, datagen providers, lang entries).
  An empty mod has no content, so its output is byte-identical to v0.1 (golden test).
- Data generation: models/blockstates, loot tables and tags come from Fabric datagen
  providers (`runDatagen`); the English names stay a plain `en_us.json` written by the
  generator (a lang provider would collide with the scaffold's file, and v0.3 adds a lang editor).
- Gradle can't order `runDatagen` before `build` in one run (it flags the implicit
  dependency), so prepare tasks run as their **own Gradle run** first (`run_gradle_prepare`).
  The app skips it when the generated files haven't changed since it last succeeded.
- Textures are stored as base64 16x16 PNGs inside element data, so the generator stays pure.
- APIs that differ between pinned Minecraft versions are avoided in templates (tags use
  `builder(tag).add(ResourceKey)`, which 26.1.2 and 26.3 share). `pnpm test:gradle` builds
  a block project on every pinned version and checks the generated JSON.

## Consequences

- NeoForge (after 1.0) = a new target with its own `adapters`; no element package changes.
- A new element type = its package + one line in `apps/desktop/src/app/modules.ts`, plus
  an adapter in each target that should support it.
- Builds with blocks take a datagen step the first time and after edits (shown as
  "Generating block data" on the first-build screen).

## No v0.1 code was refactored (plan 2.4)

- A first version restructured v0.1's `run_gradle` to run prepare steps. That was undone:
  `run_gradle` is byte-for-byte the v0.1 code again, and prepare tasks run through a new,
  separate command, `run_gradle_prepare` (plus a new `prepare` value in `GradleTask`).
  The app runs it first, then starts the real task with `run_gradle`, continuing the same log.
- All v0.1 Rust files have zero removed or changed lines against v0.1; TypeScript v0.1 code
  only gained optional fields and defaulted parameters; the empty-mod golden files are byte-identical.
- Extension point for the future: any target that needs work before a build returns task names
  from `LoaderTarget.prepareTasks`; neither command changes for it.
