// References to items and tags, as recipes and tags store them (ADR 0009):
//
//   "minecraft:wheat"     any item id (vanilla or another mod)
//   "#minecraft:planks"   an item tag
//   "berry_dough"         an item or block of this mod (no colon = an element id)
//   "#fruits"             a Tag element of this mod
//
// Element references survive renames (ids never change) and a changed mod id.
import type { Element, Project } from "@blocksy/core"
import { VANILLA_ITEMS } from "./vanilla.generated.ts"

/** Element types that are items in game (each block also has an item). */
export const ITEM_ELEMENT_TYPES = ["item", "block"]
export const TAG_ELEMENT_TYPE = "tag"

export type RefKind = "element" | "elementTag" | "item" | "tag"

export interface ParsedRef {
  kind: RefKind
  /** Element id for element kinds, the full "namespace:path" otherwise. */
  id: string
}

/** Ids like "minecraft:wheat" or "c:foods/fruit". */
export const RESOURCE_ID = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/

export function parseRef(ref: string): ParsedRef {
  const tag = ref.startsWith("#")
  const body = tag ? ref.slice(1) : ref
  if (body.includes(":")) return { kind: tag ? "tag" : "item", id: body }
  return { kind: tag ? "elementTag" : "element", id: body }
}

/** True when the text is a reference Blocksy can write (used to accept typed ids). */
export function isValidRef(ref: string): boolean {
  const body = ref.startsWith("#") ? ref.slice(1) : ref
  return RESOURCE_ID.test(body) || /^[a-z][a-z0-9_]*$/.test(body)
}

/** A Tag element's full tag id: the tag it adds to, or "<modid>:<element id>" for a new one. */
export function tagIdOf(element: Element, modId: string): string {
  const target = (element.data as { target?: unknown } | null)?.target
  return typeof target === "string" && target ? target : `${modId}:${element.id}`
}

/**
 * The id Minecraft reads ("berry_dough" -> "my_mod:berry_dough"), or null when the
 * reference points at an element that no longer exists.
 */
export function resolveRef(ref: string, project: Project): string | null {
  const { kind, id } = parseRef(ref)
  if (kind === "item") return id
  if (kind === "tag") return `#${id}`
  const element = project.elements.find((e) => e.id === id)
  if (kind === "element") return element && ITEM_ELEMENT_TYPES.includes(element.type) ? `${project.modId}:${id}` : null
  return element?.type === TAG_ELEMENT_TYPE ? `#${tagIdOf(element, project.modId)}` : null
}

/** "sweet_berries" -> "Sweet berries" (sentence case, for lists and labels). */
export function prettyId(id: string): string {
  const path = id.slice(id.indexOf(":") + 1).split("/").at(-1) ?? id
  const words = path.replaceAll("_", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** What to show for a reference: its element's name, or a readable vanilla name. */
export function refLabel(ref: string, project: Project): string {
  const { kind, id } = parseRef(ref)
  if (kind === "element" || kind === "elementTag") {
    const element = project.elements.find((e) => e.id === id)
    return element ? element.name : `Missing: ${id}`
  }
  return prettyId(id)
}

/** The element a reference points at, if it is one of this mod's. */
export function refElement(ref: string, project: Project): Element | undefined {
  const { kind, id } = parseRef(ref)
  return kind === "element" || kind === "elementTag" ? project.elements.find((e) => e.id === id) : undefined
}

/** True for ids that exist in vanilla Minecraft (warns about typos, never blocks). */
export const isVanillaItem = (id: string) => id.startsWith("minecraft:") && VANILLA_ITEMS.includes(id.slice(10))
