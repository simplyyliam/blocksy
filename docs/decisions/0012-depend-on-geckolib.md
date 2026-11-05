# 0012: Depend on GeckoLib for animated blocks, items, armor and entities

- Status: proposed
- Date: 2026-11-05

## Context

Animated machines, items, armor and mobs need a keyframe animation runtime. GeckoLib is MIT, supports Fabric, Forge, NeoForge and Quilt, lists Minecraft 26.3, 26.2 and 26.1.2, and was updated 2026-09-22 (Modrinth, checked 2026-11-05).

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Generated mods that use animation depend on GeckoLib. It becomes the first module in the Libraries registry (v0.9), listed in `fabric.mod.json` `depends` with a credit entry and credits note.

## Consequences

No own animation runtime to maintain. Users get a dependency they must ship (stated in the export screen). If GeckoLib stops supporting a target version, the registry lets a new module replace it.
