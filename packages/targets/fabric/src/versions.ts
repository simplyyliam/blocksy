// Every Minecraft version Blocksy can build for with Fabric, with exact pins.
// Source: FabricMC/fabric-example-mod (the official template) and meta.fabricmc.net,
// checked 2026-10-29. The template uses `loom 1.19-SNAPSHOT`; we pin the newest
// release instead, so the same project always builds the same way.
// Each entry is proven by a real `gradlew build` before it is added (see README).
import type { TargetVersion } from "@blocksy/core"

const GRADLE = "9.8.2"
const LOOM = "1.19.3"
const LOADER = "0.20.1"

export const FABRIC_VERSIONS: TargetVersion[] = [
  { minecraft: "26.1.2", java: 25, pins: { gradle: GRADLE, loom: LOOM, loader: LOADER, fabricApi: "0.155.3+26.1.2" } },
  { minecraft: "26.3", java: 25, pins: { gradle: GRADLE, loom: LOOM, loader: LOADER, fabricApi: "0.165.0+26.3" } },
]

/** The version the New project dialog selects first. */
export const DEFAULT_MINECRAFT_VERSION = "26.1.2"

/**
 * v0.3: true when the project's Minecraft version is `min` or newer ("26.3" >= "26.1.2").
 * Templates use it where Minecraft's API changed between pinned versions (fuel, compost).
 */
export function atLeast(ctx: { version: { minecraft: string } }, min: string): boolean {
  const a = ctx.version.minecraft.split(".").map(Number)
  const b = min.split(".").map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    if (d !== 0) return d > 0
  }
  return true
}
