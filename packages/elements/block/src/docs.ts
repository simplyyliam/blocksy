// The Block's Docs reference page is generated from this data (plan 11.2), and the
// editor shows the same labels and Java hints, so the two never drift apart.
// Java hints show vanilla Minecraft code (BlockBehaviour.Properties), not loader code.
import type { ElementDocs } from "@blocksy/core"

export const blockDocs: ElementDocs = {
  summary:
    "A block is a cube you can place in the world, like stone or planks. Blocksy writes the Java that registers it, " +
    "its item (so you can hold it), its model, the loot table that makes it drop itself, and its English name.",
  fields: [
    {
      key: "name",
      label: "Name",
      description: "The name players see in game. The id (like ruby_block) is made from the first name and never changes, because worlds save blocks by id.",
      java: '"block.<modid>.<id>": "Name"  (en_us.json)',
    },
    {
      key: "texture",
      label: "Texture",
      description: "A 16x16 PNG used on all six faces. Pixel art reads best with a few colours and a lighter top-left edge.",
      java: "assets/<modid>/textures/block/<id>.png",
    },
    {
      key: "hardness",
      label: "Hardness",
      description: "How long the block takes to mine. Dirt is 0.5, stone 1.5, obsidian 50. Zero breaks instantly.",
      java: ".strength(hardness, resistance)",
    },
    {
      key: "resistance",
      label: "Blast resistance",
      description: "How well the block survives explosions. Stone is 6, obsidian 1200.",
      java: ".strength(hardness, resistance)",
    },
    {
      key: "tool",
      label: "Tool",
      description: "The tool that mines the block quickly. Blocksy adds the block to that tool's tag (for example mineable/pickaxe).",
      java: "BlockTags.MINEABLE_WITH_PICKAXE",
    },
    {
      key: "toolTier",
      label: "Tool tier",
      description: "The weakest tool that still makes the block drop: wood, stone, iron or diamond.",
      java: "BlockTags.NEEDS_IRON_TOOL",
    },
    {
      key: "requiresTool",
      label: "Needs the right tool to drop",
      description: "When on, the block drops only if mined with the right tool and tier, like stone. When off, it always drops.",
      java: ".requiresCorrectToolForDrops()",
    },
    {
      key: "light",
      label: "Light level",
      description: "Light the block gives off, from 0 (none) to 15 (glowstone). A torch is 14.",
      java: ".lightLevel(state -> 15)",
    },
    {
      key: "sound",
      label: "Sound",
      description: "What the block sounds like when placed, walked on and broken.",
      java: ".sound(SoundType.STONE)",
    },
    {
      key: "mapColor",
      label: "Map colour",
      description: "The colour this block shows on maps.",
      java: ".mapColor(MapColor.STONE)",
    },
    {
      key: "tab",
      label: "Creative tab",
      description: "The creative tab the block appears in. Make one with the Creative tab element.",
    },
  ],
}

/** The docs entry for one field, for editor labels and hints. */
export const fieldDoc = (key: string) => blockDocs.fields.find((f) => f.key === key)!
