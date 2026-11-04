// Turns the references recipes and tags store into the ids Minecraft reads (ADR 0009):
//   "minecraft:wheat" -> "minecraft:wheat"      "#minecraft:planks" -> "#minecraft:planks"
//   "berry_dough"     -> "<modid>:berry_dough"  "#fruits"           -> "#<modid>:fruits"
// The editors use the same rules from @blocksy/game-data; this small copy keeps the target
// free of UI packages (the generator runs without React).
import type { Project } from "@blocksy/core"

const ITEM_TYPES = ["item", "block"]

/** The full tag id a Tag element writes: its target, or "<modid>:<element id>". */
export function tagId(element: { id: string; data: unknown }, modId: string): string {
  const target = (element.data as { target?: unknown } | null)?.target
  return typeof target === "string" && target ? target : `${modId}:${element.id}`
}

/** The id Minecraft reads, or null when it points at an element that no longer exists. */
export function resolveRef(ref: string, project: Project): string | null {
  const tag = ref.startsWith("#")
  const body = tag ? ref.slice(1) : ref
  if (body.includes(":")) return ref
  const element = project.elements.find((e) => e.id === body)
  if (!tag) return element && ITEM_TYPES.includes(element.type) ? `${project.modId}:${body}` : null
  return element?.type === "tag" ? `#${tagId(element, project.modId)}` : null
}
