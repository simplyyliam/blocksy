// Fabric adapter for the Item element (ADR 0006, 0009). One item becomes:
// - its texture file, plus a .mcmeta file when it is animated (written here)
// - a field in ModItems.java (registers the item with its properties)
// - a flat item model line in the data generator (ModModelProvider)
// - its English name and tooltip lines in en_us.json
// - fuel and compost: code in ModItems.initialize() on 26.1.2, or a property plus a small
//   data file on 26.3 (Minecraft moved both into item properties there)
// The shared files that collect these pieces are in ../templates/content.ts.
import type { Element, GeneratedFile, GenerateContext } from "@blocksy/core"
import { constant } from "./block.ts"
import { atLeast } from "../versions.ts"

/** The Item element's data, as far as this adapter needs it (the element checks the rest). */
export interface ItemData {
  maxStackSize: number
  rarity: "common" | "uncommon" | "rare" | "epic"
  fireResistant: boolean
  food: {
    nutrition: number
    saturation: number
    alwaysEdible: boolean
    effects: { effect: string; seconds: number; amplifier: number; chance: number }[]
  } | null
  fuelTicks: number
  compostChance: number
  tooltip: string[]
  texture: string | null
  animation: { frametime: number; interpolate: boolean } | null
  tab: string | null
}

export type ItemElement = Element & { data: ItemData }

/** Java float literal: 0.6 -> "0.6f", 1 -> "1.0f". */
const float = (n: number) => `${Number.isInteger(n) ? n.toFixed(1) : String(Math.round(n * 1000) / 1000)}f`

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

/** True when the PNG is taller than wide (frames stacked): width and height are bytes 16-23. */
function isStrip(base64: string): boolean {
  // Decode just the first 24 bytes (32 base64 characters) by hand: no browser/Node APIs needed.
  const bytes: number[] = []
  for (let i = 0; i < 32; i += 4) {
    const n = [0, 1, 2, 3].reduce((acc, k) => (acc << 6) | Math.max(0, B64.indexOf(base64[i + k] ?? "A")), 0)
    bytes.push((n >> 16) & 255, (n >> 8) & 255, n & 255)
  }
  const u32 = (o: number) => ((bytes[o]! << 24) | (bytes[o + 1]! << 16) | (bytes[o + 2]! << 8) | bytes[o + 3]!) >>> 0
  return u32(20) > u32(16)
}

/** The adapter the generator calls for each item: its texture (and animation) files. */
export function itemTemplate(item: ItemElement, ctx: GenerateContext): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const d = item.data
  if (d.texture) {
    const png = `${ctx.paths.assets}/textures/item/${item.id}.png`
    files.push({ path: png, base64: d.texture })
    // Animated: Minecraft reads the strip's frames using this file next to it.
    if (d.animation && isStrip(d.texture)) files.push({ path: `${png}.mcmeta`, contents: `${JSON.stringify({ animation: d.animation }, null, 2)}\n` })
  }
  // 26.3: fuel and compost values are small data files the item's properties point at.
  if (atLeast(ctx, "26.3")) {
    const data = `${ctx.paths.resources}/data/${ctx.project.modId}/context_int_provider`
    if (d.fuelTicks > 0) files.push({ path: `${data}/cooking/time_${item.id}.json`, contents: fuelProvider(d.fuelTicks) })
    if (d.compostChance > 0) files.push({ path: `${data}/compostable/${item.id}.json`, contents: compostProvider(d.compostChance) })
  }
  return files
}

/** 26.3 burn time: the ticks, halved in fast furnaces, the same rule vanilla's fuels use. */
const fuelProvider = (ticks: number) =>
  `${JSON.stringify(
    {
      type: "minecraft:div",
      left: ticks,
      right: {
        type: "minecraft:conditional",
        condition: "minecraft:block/fast_cooking",
        on_false: "minecraft:cooking/normal_burn_time_reduction_factor",
        on_true: "minecraft:cooking/fast_burn_time_reduction_factor",
      },
    },
    null,
    2,
  )}\n`

/** 26.3 compost: one layer with the given chance (always one in an empty composter, like vanilla). */
function compostProvider(chance: number) {
  const pct = Math.round(chance * 100)
  const roll = pct >= 100 ? 1 : { type: "minecraft:weighted_list", distribution: [{ data: 1, weight: pct }, { data: 0, weight: 100 - pct }] }
  return `${JSON.stringify(
    {
      type: "minecraft:number_dispatcher",
      cases: [{ condition: { type: "minecraft:match_block", blocks: "minecraft:composter", state: { level: "0" } }, value: 1 }],
      default: roll,
    },
    null,
    2,
  )}\n`
}

/** A short summary for the comment above the field: "food (5 hunger), stacks to 16". */
function summary(d: ItemData): string {
  const parts: string[] = []
  if (d.food) parts.push(`food (${d.food.nutrition} hunger${d.food.effects.length ? `, ${d.food.effects.length} effect${d.food.effects.length === 1 ? "" : "s"}` : ""})`)
  if (d.fuelTicks > 0) parts.push(`fuel (${d.fuelTicks} ticks)`)
  if (d.compostChance > 0) parts.push(`compostable (${Math.round(d.compostChance * 100)}%)`)
  parts.push(`stacks to ${d.maxStackSize}`)
  return parts.join(", ")
}

/** The item's field in ModItems.java. */
export function itemField(item: ItemElement, ctx: GenerateContext): string {
  const d = item.data
  const modId = ctx.project.modId
  const props: string[] = []
  if (d.maxStackSize !== 64) props.push(`.stacksTo(${d.maxStackSize})`)
  if (d.rarity !== "common") props.push(`.rarity(Rarity.${d.rarity.toUpperCase()})`)
  if (d.fireResistant) props.push(".fireResistant()")
  if (d.food) {
    const food = `new FoodProperties.Builder().nutrition(${d.food.nutrition}).saturationModifier(${float(d.food.saturation)})${d.food.alwaysEdible ? ".alwaysEdible()" : ""}.build()`
    if (d.food.effects.length === 0) props.push(`.food(${food})`)
    else {
      // What happens when you finish eating: each effect, with its chance (1.0 = always).
      const effects = d.food.effects.map(
        (e) =>
          `\t\t\t\t\t.onConsume(new ApplyStatusEffectsConsumeEffect(new MobEffectInstance(MobEffects.${e.effect.toUpperCase()}, ${Math.round(e.seconds * 20)}, ${e.amplifier}), ${float(e.chance)}))`,
      )
      props.push(`.food(${food},\n\t\t\t\tConsumables.defaultFood()\n${effects.join("\n")}\n\t\t\t\t\t.build())`)
    }
  }
  if (d.tooltip.length > 0) {
    // Tooltip lines as lore: grey, not italic, each line translated (en_us.json).
    const lines = d.tooltip.map((_, i) => `\t\t\t\t\tline("item.${modId}.${item.id}.tooltip.${i}")`).join(",\n")
    props.push(`.component(DataComponents.LORE, new ItemLore(List.of(\n${lines})))`)
  }
  if (atLeast(ctx, "26.3")) {
    if (d.fuelTicks > 0) props.push(`.cookingFuel(provider("cooking/time_${item.id}"))`)
    if (d.compostChance > 0) props.push(`.compostable(provider("compostable/${item.id}"))`)
  }
  return `	// ${item.name}: ${summary(d)}.
	public static final Item ${constant(item.id)} = register(
		"${item.id}",
		Item::new,
		new Item.Properties()${props.map((p) => `\n\t\t\t${p}`).join("")}
	);`
}

/** 26.1.2: fuel and compost are registered in code when the mod starts. */
export function itemStartup(item: ItemElement, ctx: GenerateContext): { fuel?: string; compost?: string } {
  if (atLeast(ctx, "26.3")) return {}
  const d = item.data
  return {
    fuel: d.fuelTicks > 0 ? `\t\t\tbuilder.add(${constant(item.id)}, ${d.fuelTicks});` : undefined,
    compost: d.compostChance > 0 ? `\t\tComposterBlock.COMPOSTABLES.put(${constant(item.id)}, ${float(Math.round(d.compostChance * 100) / 100)});` : undefined,
  }
}

/** The item's English name and tooltip lines. */
export const itemLang = (item: ItemElement, modId: string): [string, string][] => [
  [`item.${modId}.${item.id}`, item.name],
  ...item.data.tooltip.map((line, i): [string, string] => [`item.${modId}.${item.id}.tooltip.${i}`, line]),
]
