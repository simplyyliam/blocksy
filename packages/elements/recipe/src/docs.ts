// The Recipe's Docs reference page is generated from this data (plan 11.2).
import type { ElementDocs } from "@blocksy/core"

export const recipeDocs: ElementDocs = {
  summary:
    "A recipe is one way to make an item: in a crafting table (shaped or shapeless), a furnace, blast furnace, smoker or " +
    "stonecutter. Drag nothing, type nothing: click a slot and pick an item or a tag. Blocksy writes the recipe as a JSON " +
    "file in your mod's data, the same format Minecraft's own recipes use.",
  fields: [
    { key: "kind", label: "Kind", description: "Where the recipe is made. Shaped keeps the pattern; shapeless only cares which items are in the grid.", java: '"type": "minecraft:crafting_shaped"' },
    { key: "grid", label: "Crafting grid", description: "A 3x3 grid. Empty rows and columns around the pattern are trimmed, so a 2x2 pattern also works in the inventory grid.", java: '"pattern": ["##", "##"], "key": { "#": "minecraft:wheat" }' },
    { key: "ingredient", label: "Ingredient", description: "The one input of furnace, blast furnace, smoker and stonecutter recipes. A tag (like #minecraft:logs) accepts any item in it.", java: '"ingredient": "minecraft:potato"' },
    { key: "result", label: "Result", description: "What the recipe makes, and how many.", java: '"result": { "id": "<modid>:berry_bun", "count": 1 }' },
    { key: "cookingTime", label: "Cooking time", description: "Ticks to cook one item (20 ticks = 1 second). A furnace takes 200, blast furnaces and smokers 100.", java: '"cookingtime": 200' },
    { key: "experience", label: "Experience", description: "Experience you get per cooked item. Most food gives 0.35.", java: '"experience": 0.35' },
    { key: "category", label: "Recipe book tab", description: "Which tab of the furnace recipe book shows it: food, blocks or misc.", java: '"category": "food"' },
  ],
}

export const fieldDoc = (key: string) => recipeDocs.fields.find((f) => f.key === key)!
