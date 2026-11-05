// Where a file dropped from the desktop goes, judged by its extension (and, for pictures, its name):
//   .ogg                  sound                       .json / .bbmodel   model
//   .png "…particle…"     particle texture            .png "…gui…"       GUI texture
//   other .png            the selected block or item's texture, else a GUI texture
// Pure, so it is tested without the app (drop-route.test.ts).
import type { ResourceKind } from "@blocksy/core"

export type DropRoute = { to: "texture"; type: "block" | "item" } | { to: "resource"; kind: ResourceKind }

export function routeDroppedFile(name: string, selectedType: string | undefined): DropRoute | null {
  const lower = name.toLowerCase()
  if (lower.endsWith(".ogg")) return { to: "resource", kind: "sound" }
  if (lower.endsWith(".bbmodel") || lower.endsWith(".json")) return { to: "resource", kind: "model" }
  if (!lower.endsWith(".png")) return null
  if (lower.includes("particle")) return { to: "resource", kind: "particle-texture" }
  if (lower.includes("gui") || lower.includes("screen")) return { to: "resource", kind: "gui-texture" }
  if (selectedType === "block" || selectedType === "item") return { to: "texture", type: selectedType }
  return { to: "resource", kind: "gui-texture" }
}
