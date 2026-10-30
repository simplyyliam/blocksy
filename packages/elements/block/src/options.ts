// The choices the Block editor offers. Ids are Minecraft's own names in lowercase
// ("stone"), so any loader target can turn them into code (Fabric: SoundType.STONE).

export const TOOLS = [
  { id: "none", label: "Any (hand)" },
  { id: "pickaxe", label: "Pickaxe" },
  { id: "axe", label: "Axe" },
  { id: "shovel", label: "Shovel" },
  { id: "hoe", label: "Hoe" },
] as const

/** The lowest tool tier that still drops the block. Wood = any tool of the right kind. */
export const TOOL_TIERS = [
  { id: "wood", label: "Wood or better" },
  { id: "stone", label: "Stone or better" },
  { id: "iron", label: "Iron or better" },
  { id: "diamond", label: "Diamond or better" },
] as const

/** What the block sounds like when placed, walked on and broken. */
export const SOUNDS = [
  { id: "stone", label: "Stone" },
  { id: "wood", label: "Wood" },
  { id: "gravel", label: "Gravel" },
  { id: "grass", label: "Grass" },
  { id: "sand", label: "Sand" },
  { id: "snow", label: "Snow" },
  { id: "wool", label: "Wool" },
  { id: "glass", label: "Glass" },
  { id: "metal", label: "Metal" },
  { id: "copper", label: "Copper" },
  { id: "amethyst", label: "Amethyst" },
  { id: "deepslate", label: "Deepslate" },
  { id: "netherrack", label: "Netherrack" },
  { id: "mud", label: "Mud" },
  { id: "moss", label: "Moss" },
  { id: "bone_block", label: "Bone" },
] as const

/**
 * The colour the block shows on maps. `rgb` is Minecraft's map colour value, used only
 * to draw the swatch in the editor (it is game data, not a UI colour).
 */
export const MAP_COLORS = [
  { id: "stone", label: "Stone", rgb: "#707070" },
  { id: "deepslate", label: "Deepslate", rgb: "#646464" },
  { id: "wood", label: "Wood", rgb: "#8f7748" },
  { id: "dirt", label: "Dirt", rgb: "#976d4d" },
  { id: "grass", label: "Grass", rgb: "#7fb238" },
  { id: "sand", label: "Sand", rgb: "#f7e9a3" },
  { id: "snow", label: "Snow", rgb: "#ffffff" },
  { id: "ice", label: "Ice", rgb: "#a0a0ff" },
  { id: "water", label: "Water", rgb: "#4040ff" },
  { id: "metal", label: "Metal", rgb: "#a7a7a7" },
  { id: "gold", label: "Gold", rgb: "#faee4d" },
  { id: "diamond", label: "Diamond", rgb: "#5cdbd5" },
  { id: "lapis", label: "Lapis", rgb: "#4a80ff" },
  { id: "emerald", label: "Emerald", rgb: "#00d93a" },
  { id: "quartz", label: "Quartz", rgb: "#fffcf5" },
  { id: "clay", label: "Clay", rgb: "#a4a8b8" },
  { id: "nether", label: "Nether", rgb: "#700200" },
  { id: "fire", label: "Fire", rgb: "#ff0000" },
  { id: "color_red", label: "Red", rgb: "#993333" },
  { id: "color_orange", label: "Orange", rgb: "#d87f33" },
  { id: "color_yellow", label: "Yellow", rgb: "#e5e533" },
  { id: "color_green", label: "Green", rgb: "#667f33" },
  { id: "color_light_blue", label: "Light blue", rgb: "#6699d8" },
  { id: "color_blue", label: "Blue", rgb: "#334cb2" },
  { id: "color_purple", label: "Purple", rgb: "#7f3fb2" },
  { id: "color_pink", label: "Pink", rgb: "#f27fa5" },
  { id: "color_black", label: "Black", rgb: "#191919" },
] as const

type Ids<T extends readonly { id: string }[]> = { [K in keyof T]: T[K]["id"] }
const ids = <T extends readonly { id: string }[]>(list: T) => list.map((o) => o.id) as unknown as Ids<T>

export const TOOL_IDS = ids(TOOLS)
export const TOOL_TIER_IDS = ids(TOOL_TIERS)
export const SOUND_IDS = ids(SOUNDS)
export const MAP_COLOR_IDS = ids(MAP_COLORS)

/** Familiar blocks to compare against, shown next to hardness and resistance. */
export const STRENGTH_EXAMPLES = [
  { name: "Dirt", hardness: 0.5, resistance: 0.5 },
  { name: "Planks", hardness: 2, resistance: 3 },
  { name: "Stone", hardness: 1.5, resistance: 6 },
  { name: "Iron block", hardness: 5, resistance: 6 },
  { name: "Obsidian", hardness: 50, resistance: 1200 },
] as const
