# Architecture decision records

An ADR is a short note that records one architectural choice: why it came up,
what was decided, and what follows from it. They are never rewritten later; a
changed decision gets a new ADR that supersedes the old one.

## Template

Copy this into `NNNN-short-title.md`, using the next free number.

```markdown
# NNNN: Title

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD

## Context

What problem or force made a decision necessary.

## Decision

What we chose, in plain words.

## Consequences

What becomes easier, harder, or must now be done.
```

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-monorepo.md) | One pnpm-workspaces monorepo | accepted |
| [0002](0002-stack-and-versions.md) | Stack and pinned versions | accepted |
| [0003](0003-registries.md) | Registries as the only way modules plug in | accepted |
| [0004](0004-bindings-errors-updater.md) | Generated bindings, one error shape, gated updater | accepted |
| [0005](0005-shadcn-ui.md) | shadcn/ui for every UI component, left as installed | accepted |
| [0006](0006-element-adapters-and-datagen.md) | Loader code for elements lives in the target; Fabric data generation | accepted |
| [0007](0007-router-layouts.md) | react-router with layout routes | accepted |
| [0008](0008-perf-0.2-memory.md) | Memory rises in 0.2 because the bench now opens a 3D view | accepted |
| [0011](0011-vanilla-asset-reader.md) | Vanilla asset reader for real Minecraft previews | proposed |
| [0012](0012-depend-on-geckolib.md) | Depend on GeckoLib for animated blocks, items, armor and entities | proposed |
| [0013](0013-own-gui-runtime.md) | GUI output: plain widget code and a small Blocksy UI runtime | proposed |
| [0014](0014-shared-timeline-and-effects-runtime.md) | Shared timeline package and own effect runtime | proposed |
| [0015](0015-own-abilities-runtime.md) | Build our own data-driven abilities runtime | proposed |
| [0016](0016-own-combat-and-player-animation.md) | Build our own weapon combat data and player pose layer | proposed |
| [0017](0017-own-screen-effects.md) | Build our own screen effects instead of Satin API | proposed |
