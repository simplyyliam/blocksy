// Turns this mod's things and recipe references into what the Minecraft renderer draws.
// The user's own items and blocks show their own pixels at once (no vanilla assets needed);
// vanilla items are drawn from the game's files once they are available.
import type { Element, Project } from "@blocksy/core"
import type { McItem } from "@blocksy/ui"
import { parseRef, refElement } from "./refs.ts"

/** An item or block element as a slot picture: items flat, blocks as a cube. */
export function elementToMcItem(element: Element): McItem {
  const data = element.data as { texture?: unknown; animation?: { frametime?: number } | null } | null
  const texture = typeof data?.texture === "string" ? data.texture : null
  // No texture yet: draw the neutral placeholder instead of an empty slot.
  if (!texture) return { vanilla: "minecraft:air" }
  if (element.type === "block") return { blockTexture: texture }
  return { texture, animated: data?.animation?.frametime ? { frametime: data.animation.frametime } : undefined }
}

export type SlotPicture = { kind: "item"; item: McItem } | { kind: "tag"; label: string } | { kind: "empty" }

/** What a recipe or tag slot shows for a reference ("minecraft:wheat", "berry_dough", "#fruits"). */
export function slotPicture(ref: string | null, project: Project): SlotPicture {
  if (!ref) return { kind: "empty" }
  const { kind, id } = parseRef(ref)
  // A vanilla tag is drawn as one of its items; the user's own tags have no picture to borrow.
  if (kind === "tag") return { kind: "item", item: { tag: id } }
  if (kind === "elementTag") return { kind: "tag", label: `#${id}` }
  if (kind === "item") return { kind: "item", item: { vanilla: id } }
  const element = refElement(ref, project)
  return element ? { kind: "item", item: elementToMcItem(element) } : { kind: "item", item: { vanilla: "minecraft:air" } }
}

/** The vanilla item ids a list of pictures needs loaded. */
export const vanillaIds = (pictures: SlotPicture[]): string[] =>
  pictures.flatMap((p) => (p.kind === "item" ? ("vanilla" in p.item ? [p.item.vanilla] : "tag" in p.item ? [`#${p.item.tag}`] : []) : []))
