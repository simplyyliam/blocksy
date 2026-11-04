// The Tag element's data. A tag is a named list of items (or blocks) that recipes and
// game rules can refer to as one: "#minecraft:planks" accepts every kind of plank.
//
//   target: null              -> a new tag of your mod: #<modid>:<element id>
//   target: "minecraft:planks" -> adds your entries to an existing tag (vanilla or another mod)
import { z } from "zod"

/** Ids like "minecraft:planks" or "c:foods/fruit". */
export const TAG_ID = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/

/**
 * Block tags Blocksy already fills from each block's Tool setting (data generation).
 * The tags editor can't add to them, so no file is written twice (ADR 0009).
 */
export const RESERVED_BLOCK_TAGS = [/^minecraft:mineable\//, /^minecraft:needs_(stone|iron|diamond)_tool$/]

export const tagSchema = z
  .object({
    registry: z.enum(["item", "block"]),
    target: z.string().regex(TAG_ID, "Use a tag id like minecraft:planks").nullable(),
    /** References: "minecraft:apple", "#minecraft:flowers", "berry_bun", "#other_tag". */
    values: z.array(z.string().min(1).max(200)).max(500),
  })
  .refine((t) => !(t.registry === "block" && t.target && RESERVED_BLOCK_TAGS.some((r) => r.test(t.target!))), {
    message: "Blocksy fills this tag from each block's Tool setting",
    path: ["target"],
  })

export type TagData = z.infer<typeof tagSchema>

export const tagDefaults = (): TagData => ({ registry: "item", target: null, values: [] })

/** Where the tag's JSON goes, relative to the data folder: "<ns>/tags/<item|block>/<path>.json". */
export function tagFilePath(data: TagData, elementId: string, modId: string): string {
  const id = data.target ?? `${modId}:${elementId}`
  const [ns, path] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)]
  return `${ns}/tags/${data.registry}/${path}.json`
}
