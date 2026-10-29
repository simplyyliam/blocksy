# @blocksy/target-fabric

The Fabric loader target: templates, file layout and API adapters for every element and node. This is the only place in Blocksy allowed to mention Fabric, so adding NeoForge later is a new sibling folder, not a rewrite.

## Pinned versions

Templates follow the official [fabric-example-mod](https://github.com/FabricMC/fabric-example-mod) (CC0), with one change: every version is exact. The template uses `loom 1.19-SNAPSHOT`; Blocksy pins the newest Loom release.

| Minecraft | Java | Gradle | Loom | Loader | Fabric API |
| --- | --- | --- | --- | --- | --- |
| 26.1.2 | 25 | 9.8.2 | 1.19.3 | 0.20.1 | 0.155.3+26.1.2 |
| 26.3 | 25 | 9.8.2 | 1.19.3 | 0.20.1 | 0.165.0+26.3 |

The source of truth is `src/versions.ts`. A version is only added after `pnpm test:gradle` builds a generated empty mod for it.

## Files

- `src/templates/` one small template per generated file
- `wrapper/` the Gradle wrapper (Apache-2.0) from the official template; after replacing it, run `pnpm --filter @blocksy/target-fabric sync-wrapper` to regenerate `src/wrapper.generated.ts`
