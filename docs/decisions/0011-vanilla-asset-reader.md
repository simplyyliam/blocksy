# 0011: Vanilla asset reader for real Minecraft previews

- Status: proposed
- Date: 2026-11-05

## Context

Every preview (creative tab, recipes, item in slot) is drawn in Blocksy's own web style, so nothing looks like Minecraft. Plan 10.1 reads vanilla GUI art in v0.9 only. Rule 10 forbids shipping Mojang's assets.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Add a vanilla asset reader to the Editor refresh release. Rust (thin) opens `~/.gradle/caches/fabric-loom/<mc-version>/minecraft-client.jar` read-only and returns bytes for a path. TypeScript resolves sprites, `.mcmeta` scaling (stretch, tile, nine_slice), textures and fonts, caches decoded images in memory only, and a Minecraft renderer in `packages/ui` draws panels, slots, items, blocks and text. Before the first build (the jar does not exist yet) the app shows "Build once to load Minecraft's look" and the existing placeholder preview.

## Consequences

Previews look like the real game from the Editor refresh on. Nothing is bundled, committed, written into the project or uploaded (Docs, GitHub sync and support reports included). The jar path depends on Loom's cache layout; a test covers path discovery. Later a user-chosen launcher folder could be added as a fallback; Blocksy never downloads Mojang assets itself.
