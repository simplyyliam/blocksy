// The Block element's data: everything a basic block needs (plan section 3,
// "Blocks: basics"). The element's name is its in-game name; its id is the
// Minecraft id (ruby_block) and never changes, because worlds save blocks by id.
import { z } from "zod"
import { MAP_COLOR_IDS, SOUND_IDS, TOOL_IDS, TOOL_TIER_IDS } from "./options.ts"
import { pngSize } from "./png.ts"
import { starterTexture } from "./starter-texture.ts"

/** Textures are 16x16 PNGs, stored as base64 text inside the project file. */
export const TEXTURE_SIZE = 16

export const blockSchema = z.object({
  /** How long it takes to mine (stone 1.5, obsidian 50). 0 breaks instantly. */
  hardness: z.number().min(0, "Hardness can't be negative").max(100, "Hardness goes up to 100"),
  /** How well it survives explosions (stone 6, obsidian 1200). */
  resistance: z.number().min(0, "Resistance can't be negative").max(3_600_000, "Resistance goes up to 3,600,000"),
  /** The tool that mines it fast. */
  tool: z.enum(TOOL_IDS),
  /** The weakest tool tier that still makes it drop. */
  toolTier: z.enum(TOOL_TIER_IDS),
  /** Drops only when mined with the right tool (like stone). */
  requiresTool: z.boolean(),
  /** Light it gives off, 0 (none) to 15 (as bright as glowstone). */
  light: z.number().int().min(0).max(15, "Light goes up to 15"),
  sound: z.enum(SOUND_IDS),
  mapColor: z.enum(MAP_COLOR_IDS),
  /** Base64 16x16 PNG, or null for no texture yet. */
  texture: z
    .string()
    .nullable()
    .refine((t) => {
      if (t === null) return true
      const size = pngSize(t)
      return size?.width === TEXTURE_SIZE && size.height === TEXTURE_SIZE
    }, "Textures must be 16x16 PNG images"),
  /** The creative tab element it shows in, or null for none. */
  tab: z.string().nullable(),
})

export type BlockData = z.infer<typeof blockSchema>

/** A new block behaves like stone and wears Blocksy's starter texture. */
export const blockDefaults = (): BlockData => ({
  hardness: 1.5,
  resistance: 6,
  tool: "pickaxe",
  toolTier: "wood",
  requiresTool: true,
  light: 0,
  sound: "stone",
  mapColor: "stone",
  texture: starterTexture(),
  tab: null,
})
