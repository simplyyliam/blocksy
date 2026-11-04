// The v0.3 "First item" test mod: everything items, recipes, tags and languages can do.
//   Berry Dough  (crafted shapeless from wheat + sweet berries, compostable, burns briefly)
//   Berry Bun    (smelted or smoked from the dough; food with Speed; animated; tooltip)
//   Sky Gem      (rare, fire resistant, stacks to 16; shaped from a tag; stonecut into dust)
// plus a block, a creative tab, two tags (a new one and one added to c:foods/fruit) and
// two languages (German, and an English override).
import { addElement, createDocumentStore, createProject, createRegistries, type Project } from "@blocksy/core"
import { blockDefaults, blockElement } from "@blocksy/element-block"
import { creativeTabElement } from "@blocksy/element-creative-tab"
import { berryBunTexture, berryDoughTexture, foodDefaults, itemDefaults, itemElement } from "@blocksy/element-item"
import { languageElement } from "@blocksy/element-language"
import { recipeDefaults, recipeElement } from "@blocksy/element-recipe"
import { tagElement } from "@blocksy/element-tag"
import { fabricTarget } from "@blocksy/target-fabric"

export function firstItemRegistries() {
  const registries = createRegistries()
  registries.loaderTargets.register(fabricTarget)
  for (const type of [creativeTabElement, blockElement, itemElement, recipeElement, tagElement, languageElement]) registries.elementTypes.register(type)
  return registries
}

const empty = (): (string | null)[] => Array(9).fill(null)

export function firstItemMod(minecraftVersion = "26.1.2"): Project {
  const store = createDocumentStore(createProject({ name: "First Item", target: "fabric", minecraftVersion }))
  const add = (id: string, type: string, name: string, data: unknown) => store.execute(addElement({ id, type, name, data }))
  const bun = berryBunTexture()

  add("first_item_tab", "creative_tab", "First Item", { icon: "berry_bun" })
  add("berry_crate", "block", "Berry Crate", { ...blockDefaults(), tool: "axe", sound: "wood", mapColor: "wood", tab: "first_item_tab" })
  add("berry_dough", "item", "Berry Dough", { ...itemDefaults(), texture: berryDoughTexture(), fuelTicks: 100, compostChance: 0.65, tab: "first_item_tab" })
  add("berry_bun", "item", "Berry Bun", {
    ...itemDefaults(),
    texture: bun.png,
    animation: { frametime: 8, interpolate: false },
    food: { ...foodDefaults(), nutrition: 6, saturation: 0.8, effects: [{ effect: "speed", seconds: 10, amplifier: 0, chance: 1 }] },
    compostChance: 1,
    tooltip: ["Fresh from the furnace", "Still warm"],
    tab: "first_item_tab",
  })
  add("sky_gem", "item", "Sky Gem", { ...itemDefaults(), maxStackSize: 16, rarity: "rare", fireResistant: true, tab: "first_item_tab" })
  add("sky_dust", "item", "Sky Dust", { ...itemDefaults(), tab: null })

  add("fruits", "tag", "Fruits", { registry: "item", target: null, values: ["minecraft:sweet_berries", "minecraft:apple", "berry_bun"] })
  add("common_fruit", "tag", "Common fruit", { registry: "item", target: "c:foods/fruit", values: ["berry_bun"] })
  add("crate_logs", "tag", "Crate logs", { registry: "block", target: "minecraft:logs", values: ["berry_crate"] })

  add("berry_dough_recipe", "recipe", "Berry Dough", { ...recipeDefaults(), kind: "shapeless", grid: ["minecraft:wheat", "minecraft:sweet_berries", ...Array(7).fill(null)], result: "berry_dough", count: 2 })
  add("berry_bun_smelting", "recipe", "Berry Bun (furnace)", { ...recipeDefaults(), kind: "smelting", ingredient: "berry_dough", result: "berry_bun", cookingTime: 200, experience: 0.35, category: "food" })
  add("berry_bun_smoking", "recipe", "Berry Bun (smoker)", { ...recipeDefaults(), kind: "smoking", ingredient: "berry_dough", result: "berry_bun", cookingTime: 100, experience: 0.35, category: "food" })
  add("sky_gem_recipe", "recipe", "Sky Gem", {
    ...recipeDefaults(),
    kind: "shaped",
    // A diamond ringed by fruit, in the top-left 2x2 corner (trimmed to a 2x2 pattern).
    grid: ["#fruits", "minecraft:diamond", null, "minecraft:diamond", "#fruits", null, null, null, null],
    result: "sky_gem",
  })
  add("sky_dust_cutting", "recipe", "Sky Dust", { ...recipeDefaults(), kind: "stonecutting", ingredient: "sky_gem", result: "sky_dust", count: 4 })
  add("crate_blasting", "recipe", "Charcoal from crates", { ...recipeDefaults(), kind: "blasting", ingredient: "berry_crate", result: "minecraft:charcoal", cookingTime: 100 })
  // Incomplete recipes are skipped, never written half-done.
  add("unfinished", "recipe", "Unfinished", { ...recipeDefaults(), grid: empty() })

  add("german", "language", "German", { locale: "de_de", entries: { "item.first_item.berry_bun": "Beerenbrötchen", "item.first_item.berry_dough": "" } })
  add("english", "language", "English", { locale: "en_us", entries: { "item.first_item.sky_dust": "Sky Dust (pinch)", "message.first_item.hello": "Hello!" } })
  return store.get()
}
