// The Item element's data: everything a basic item needs (plan section 3, "Items: basics").
// The element's name is its in-game name; its id is the Minecraft id (berry_bun) and never
// changes, because worlds save items by id.
import { pngSize } from "@blocksy/pixel"
import { z } from "zod"
import { EFFECT_IDS, RARITY_IDS } from "./options.ts"

/** Item textures are 16x16; animated ones stack their frames into a 16-wide strip. */
export const TEXTURE_SIZE = 16
export const MAX_FRAMES = 64

export const effectSchema = z.object({
  effect: z.enum(EFFECT_IDS),
  /** How long it lasts, in seconds (stored as seconds, written as ticks: x20). */
  seconds: z.number().min(0.05).max(3600, "Effects last up to an hour here"),
  /** 0 = level I, 1 = level II, ... */
  amplifier: z.number().int().min(0).max(9),
  /** 0..1, how likely eating gives the effect (1 = always). */
  chance: z.number().min(0).max(1),
})

export const foodSchema = z.object({
  /** Hunger points it fills (each drumstick on the hunger bar is 2). Bread is 5. */
  nutrition: z.number().int().min(0).max(20),
  /** Saturation modifier: saturation = nutrition x modifier x 2. Bread is 0.6. */
  saturation: z.number().min(0).max(5),
  /** Can be eaten even when the hunger bar is full (like golden apples). */
  alwaysEdible: z.boolean(),
  effects: z.array(effectSchema).max(8),
})

export const animationSchema = z.object({
  frametime: z.number().int().min(1).max(1000),
  interpolate: z.boolean(),
})

/** v0.4: the paint layers behind the flat texture (saved as strip PNGs). Optional: older projects have none. */
export const storedLayerSchema = z.object({ name: z.string().max(40), visible: z.boolean(), png: z.string() })

export const itemSchema = z.object({
  /** How many fit in one inventory slot, 1 to 99. */
  maxStackSize: z.number().int().min(1, "Stacks hold at least 1").max(99, "Stacks hold up to 99"),
  rarity: z.enum(RARITY_IDS),
  /** Survives fire and lava as a dropped item, like netherite. */
  fireResistant: z.boolean(),
  /** Null = not food. */
  food: foodSchema.nullable(),
  /** Furnace burn time in ticks (coal is 1600). 0 = not a fuel. */
  fuelTicks: z.number().int().min(0).max(32000),
  /** 0..1, how likely one item adds a composter layer. 0 = not compostable. */
  compostChance: z.number().min(0).max(1),
  /** Extra lines under the name when you hover the item. */
  tooltip: z.array(z.string().max(120)).max(6),
  /** Base64 PNG, 16 wide; 16 tall, or a strip of frames. Null = no texture yet. */
  texture: z
    .string()
    .nullable()
    .refine((t) => {
      if (t === null) return true
      const size = pngSize(t)
      return !!size && size.width === TEXTURE_SIZE && size.height % TEXTURE_SIZE === 0 && size.height >= TEXTURE_SIZE && size.height <= TEXTURE_SIZE * MAX_FRAMES
    }, "Item textures are 16x16 PNGs (animated: 16 wide, frames stacked)"),
  /** Animation settings for a strip texture (written as <id>.png.mcmeta). */
  animation: animationSchema.nullable(),
  /** The paint layers (v0.4); `texture` is always the merged picture. */
  layers: z.array(storedLayerSchema).max(8).nullish(),
  /** The creative tab element it shows in, or null for none. */
  tab: z.string().nullable(),
})

export type ItemData = z.infer<typeof itemSchema>
export type FoodData = z.infer<typeof foodSchema>
export type EffectData = z.infer<typeof effectSchema>

/** A plain new item: stacks to 64, no texture yet (paint one on the canvas). */
export const itemDefaults = (): ItemData => ({
  maxStackSize: 64,
  rarity: "common",
  fireResistant: false,
  food: null,
  fuelTicks: 0,
  compostChance: 0,
  tooltip: [],
  texture: null,
  animation: null,
  tab: null,
})

/** Food values a new food starts with (like bread). */
export const foodDefaults = (): FoodData => ({ nutrition: 5, saturation: 0.6, alwaysEdible: false, effects: [] })
