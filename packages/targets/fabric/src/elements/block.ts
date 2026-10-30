// Fabric adapter for the Block element (ADR 0006). One block becomes:
// - its texture file (written here, by the generator)
// - a field in ModBlocks.java (registers the block and its item)
// - lines in the data generators: model, loot table ("drops itself"), tool tags
// - its English name in en_us.json
// The shared files that collect these pieces are in ../templates/content.ts.
import type { Element, GeneratedFile, GenerateContext } from "@blocksy/core"

/** The Block element's data, as far as this adapter needs it (the element checks the rest). */
export interface BlockData {
  hardness: number
  resistance: number
  tool: "none" | "pickaxe" | "axe" | "shovel" | "hoe"
  toolTier: "wood" | "stone" | "iron" | "diamond"
  requiresTool: boolean
  light: number
  sound: string
  mapColor: string
  texture: string | null
  tab: string | null
}

export type BlockElement = Element & { data: BlockData }

/** Java constant name: "ruby_block" -> "RUBY_BLOCK". */
export const constant = (id: string) => id.toUpperCase()

/** "a" or "an", for the comments Blocksy writes ("an axe", "a pickaxe"). */
const article = (word: string) => (/^[aeiou]/.test(word) ? "an" : "a")

/** Java float literal: 1.5 -> "1.5f", 6 -> "6.0f". */
const float = (n: number) => `${Number.isInteger(n) ? n.toFixed(1) : n}f`

/** The adapter the generator calls for each block: just its texture file. */
export function blockTemplate(block: BlockElement, ctx: GenerateContext): GeneratedFile[] {
  if (!block.data.texture) return []
  return [{ path: `${ctx.paths.assets}/textures/block/${block.id}.png`, base64: block.data.texture }]
}

/** The block's field in ModBlocks.java. */
export function blockField(block: BlockElement): string {
  const d = block.data
  const properties = [
    `.strength(${float(d.hardness)}, ${float(d.resistance)})`,
    d.tool !== "none" && d.requiresTool && ".requiresCorrectToolForDrops()",
    d.light > 0 && `.lightLevel(state -> ${d.light})`,
    `.sound(SoundType.${d.sound.toUpperCase()})`,
    `.mapColor(MapColor.${d.mapColor.toUpperCase()})`,
  ].filter(Boolean)
  const mined =
    d.tool === "none" ? "mined by hand" : d.toolTier === "wood" ? `mined with ${article(d.tool)} ${d.tool}` : `needs ${article(d.toolTier)} ${d.toolTier} ${d.tool} or better`
  return `	// ${block.name}: hardness ${d.hardness}, blast resistance ${d.resistance}, ${mined}.
	public static final Block ${constant(block.id)} = register(
		"${block.id}",
		Block::new,
		BlockBehaviour.Properties.of()
			${properties.join("\n\t\t\t")}
	);`
}

/** Tags this block belongs to, e.g. mineable/pickaxe and needs_iron_tool. */
export function blockTags(block: BlockElement): string[] {
  const { tool, toolTier } = block.data
  if (tool === "none") return []
  const tags = [`MINEABLE_WITH_${tool.toUpperCase()}`]
  if (toolTier !== "wood") tags.push(`NEEDS_${toolTier.toUpperCase()}_TOOL`)
  return tags
}

/** The block's English name. Its item uses the same key (useBlockDescriptionPrefix). */
export const blockLang = (block: BlockElement, modId: string): [string, string] => [`block.${modId}.${block.id}`, block.name]
