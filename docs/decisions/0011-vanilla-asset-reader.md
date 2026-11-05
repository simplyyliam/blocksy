# 0011: Vanilla asset reader and workspace index

- Status: proposed
- Date: 2026-11-05

## Context

Every preview (creative tab, recipes, item in slot) was drawn in Blocksy's own web style, so nothing looked like Minecraft. Plan 10.1 read vanilla GUI art in v0.10 only. Rule 10 forbids shipping Mojang's assets, and the user's project must never hold them.

MCreator solves "know where Minecraft is" with a small cache file (`.mcreator/generatorGradleCache`) written after its Gradle setup. Blocksy does the same.

Details: `docs/research/` (local) libraries.md, effects.md, gui-creation.md.

## Decision

Three small pieces, all in the Editor refresh (v0.4).

1. **Workspace setup.** When a project is created, Blocksy runs the first Gradle setup (the normal first build) in the background. A progress view shows what is downloading, how far along it is (a bar, percent, and megabytes when Gradle prints them) and roughly how long is left, with a one-time note that later projects reuse the download. "Open editor now" lets the user in before it ends. When Minecraft is already in the Gradle cache the editor opens at once, with the look ready.
2. **Workspace index.** After setup (and whenever a Gradle run ends, or the project opens with no valid index) Blocksy writes `.blocksy/workspace-index.json` in the project: `formatVersion`, the Minecraft version, the loader, and **paths** to the client jar, the asset index, the asset objects folder and the loader jars, all inside the user's Gradle cache. The index is rebuilt when the project's Minecraft version changes or the jar it names is gone. It holds paths only, never content. Paths are machine-specific, so `.blocksy/` is in the generated `.gitignore` of every new project and is added to existing projects' `.gitignore` when they open. It is never committed or synced.
3. **Asset reader.** Rust (thin) finds the files (`find_workspace_files`) and returns raw bytes (`read_jar_entry`, `list_jar_entries`, `read_asset_object`). TypeScript (`shared/vanilla/`) decodes PNGs, reads `.mcmeta` (animation, and GUI scaling: stretch, tile, nine_slice), resolves item and block models through their parent chains to a flat sprite or a cube, and builds the bitmap font. Decoded images and parsed JSON live **in memory only**. A renderer in `packages/ui` (`McScreen`, canvas drawing in integer scales) draws panels, slots, items, blocks and text; it only knows an `McAssets` interface, so it never touches Tauri. Previews are always vanilla, in both themes.

Safety rules, enforced in Rust and covered by tests: a jar can only be opened if it is a `.jar` inside `~/.gradle/caches` (after resolving links and `..`); only entries under `assets/` with plain names (lowercase, digits, `_/.-`) can be read or listed; entries are capped at 16 MB; nothing is written, copied or bundled.

Fallback: until the client jar exists the editor shows "Build once to load Minecraft's look" and a button that runs the first build. The user's own pixels (their items and blocks) always show at once, with or without Minecraft's assets.

## Consequences

Previews look like the real game. Nothing from Minecraft is stored anywhere except the user's Gradle cache and the small index (paths). Nothing is bundled, committed, written into the project, uploaded or sent in support reports.

The jar path depends on Loom's cache layout (`fabric-loom/<version>/minecraft-client.jar`, `fabric-loom/assets/`); a loader target with another layout needs its own finder, which is the only place that must change. Models that need entity renderers (chests, banners, heads) are drawn as a quiet placeholder rather than guessed.

Later a user-chosen launcher folder could be a fallback; Blocksy never downloads Mojang assets itself.
