// Starters: what a new project begins with (the left column of New project).
// - Blank mod: nothing, just the empty mod.
// - Starter block (v0.2 "First block"): a creative tab with one block in it, wearing
//   Blocksy's own starter texture, so Run shows a real block in game straight away.
// - Starter item (v0.3 "First item"): a tab, Berry Dough (crafted from wheat and sweet
//   berries) and a Berry Bun (cooked from the dough, eaten for a burst of speed), with
//   their recipes: craft it, cook it in a furnace, eat it.
import { addElement, createDocumentStore, deriveElementId, type Project } from "@blocksy/core"
import { blockDefaults } from "@blocksy/element-block"
import { creativeTabElement } from "@blocksy/element-creative-tab"
import { berryBunTexture, berryDoughTexture, foodDefaults, itemDefaults } from "@blocksy/element-item"
import { recipeDefaults } from "@blocksy/element-recipe"

export type StarterId = "empty" | "block" | "item"

export function applyStarter(project: Project, starter: StarterId): Project {
  if (starter === "empty") return project
  const store = createDocumentStore(project)
  const tabId = deriveElementId(`${project.name} tab`, [])
  if (starter === "block") {
    store.execute(addElement({ id: tabId, type: creativeTabElement.id, name: project.name, data: { icon: "first_block" } }))
    store.execute(addElement({ id: "first_block", type: "block", name: "First Block", data: { ...blockDefaults(), tab: tabId } }))
    return store.get()
  }
  const add = (id: string, type: string, name: string, data: unknown) => store.execute(addElement({ id, type, name, data }))
  const bun = berryBunTexture()
  add(tabId, creativeTabElement.id, project.name, { icon: "berry_bun" })
  add("berry_dough", "item", "Berry Dough", { ...itemDefaults(), texture: berryDoughTexture(), compostChance: 0.5, tab: tabId })
  add("berry_bun", "item", "Berry Bun", {
    ...itemDefaults(),
    texture: bun.png,
    animation: { frametime: 8, interpolate: false },
    food: { ...foodDefaults(), nutrition: 6, saturation: 0.8, effects: [{ effect: "speed", seconds: 10, amplifier: 0, chance: 1 }] },
    tooltip: ["Warm from the furnace"],
    tab: tabId,
  })
  add("berry_dough_recipe", "recipe", "Berry Dough", {
    ...recipeDefaults(),
    kind: "shapeless",
    grid: ["minecraft:wheat", "minecraft:sweet_berries", null, null, null, null, null, null, null],
    result: "berry_dough",
  })
  add("berry_bun_smelting", "recipe", "Berry Bun (furnace)", {
    ...recipeDefaults(),
    kind: "smelting",
    ingredient: "berry_dough",
    result: "berry_bun",
    cookingTime: 200,
    experience: 0.35,
    category: "food",
  })
  add("berry_bun_smoking", "recipe", "Berry Bun (smoker)", {
    ...recipeDefaults(),
    kind: "smoking",
    ingredient: "berry_dough",
    result: "berry_bun",
    cookingTime: 100,
    experience: 0.35,
    category: "food",
  })
  return store.get()
}
