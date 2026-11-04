// Golden files for the v0.3 "First item" mod, on both pinned Minecraft versions (they
// differ in fuel, compost and crafting categories). Open __golden__/first-item-26.1.2/
// to see exactly what Blocksy writes for items, recipes, tags and languages.
// After an intended template change, update them with: pnpm test -u
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { fabricTarget } from "@blocksy/target-fabric"
import { generate } from "./index.ts"
import { firstItemMod, firstItemRegistries } from "./__fixtures__/first-item.ts"

const text = (files: ReturnType<typeof generate>, end: string) => {
  const file = files.find((f) => f.path.endsWith(end))
  return file && "contents" in file ? file.contents : undefined
}

describe.each(["26.1.2", "26.3"])("first item mod on %s", (minecraft) => {
  it("matches the golden files", async () => {
    for (const file of generate(firstItemMod(minecraft), firstItemRegistries())) {
      if ("contents" in file) {
        await expect(file.contents).toMatchFileSnapshot(`./__golden__/first-item-${minecraft}/${file.path}`)
      } else {
        const hash = createHash("sha256").update(Buffer.from(file.base64, "base64")).digest("hex")
        await expect(`${hash}\n`).toMatchFileSnapshot(`./__golden__/first-item-${minecraft}/${file.path}.sha256`)
      }
    }
  })

  it("is pure", () => {
    expect(generate(firstItemMod(minecraft), firstItemRegistries())).toEqual(generate(firstItemMod(minecraft), firstItemRegistries()))
  })
})

describe("first item mod", () => {
  const files = generate(firstItemMod(), firstItemRegistries())
  const json = (end: string) => JSON.parse(text(files, end) ?? "null")

  it("writes recipes Minecraft can read, and skips unfinished ones", () => {
    expect(json("recipe/berry_dough_recipe.json")).toEqual({
      type: "minecraft:crafting_shapeless",
      category: "misc",
      ingredients: ["minecraft:wheat", "minecraft:sweet_berries"],
      result: { id: "first_item:berry_dough", count: 2 },
    })
    // The 3x3 grid is trimmed to the 2x2 corner, with a letter per ingredient.
    expect(json("recipe/sky_gem_recipe.json")).toMatchObject({ pattern: ["FD", "DF"], key: { F: "#first_item:fruits", D: "minecraft:diamond" } })
    expect(json("recipe/berry_bun_smelting.json")).toMatchObject({ type: "minecraft:smelting", ingredient: "first_item:berry_dough", cookingtime: 200 })
    expect(files.some((f) => f.path.endsWith("recipe/unfinished.json"))).toBe(false)
  })

  it("doubles blast furnace and smoker times on 26.3, where those stations are twice as fast", () => {
    const newer = generate(firstItemMod("26.3"), firstItemRegistries())
    expect(JSON.parse(text(newer, "recipe/berry_bun_smoking.json")!).cookingtime).toBe(200)
    expect(json("recipe/berry_bun_smoking.json").cookingtime).toBe(100)
    expect(JSON.parse(text(newer, "recipe/berry_dough_recipe.json")!).category).toBeUndefined()
  })

  it("merges tags and writes them under their namespace", () => {
    expect(json("data/first_item/tags/item/fruits.json").values).toEqual(["minecraft:sweet_berries", "minecraft:apple", "first_item:berry_bun"])
    expect(json("data/c/tags/item/foods/fruit.json").values).toEqual(["first_item:berry_bun"])
    expect(json("data/minecraft/tags/block/logs.json").values).toEqual(["first_item:berry_crate"])
  })

  it("writes English (with overrides) and German, skipping empty translations", () => {
    expect(json("lang/en_us.json")).toMatchObject({ "item.first_item.berry_bun": "Berry Bun", "item.first_item.sky_dust": "Sky Dust (pinch)", "message.first_item.hello": "Hello!" })
    expect(json("lang/en_us.json")["item.first_item.berry_bun.tooltip.1"]).toBe("Still warm")
    expect(json("lang/de_de.json")).toEqual({ "item.first_item.berry_bun": "Beerenbrötchen" })
  })

  it("animates the bun with a .mcmeta file next to its texture", () => {
    expect(json("textures/item/berry_bun.png.mcmeta")).toEqual({ animation: { frametime: 8, interpolate: false } })
    expect(files.some((f) => f.path.endsWith("textures/item/berry_dough.png.mcmeta"))).toBe(false)
  })

  it("registers fuel and compost the way each Minecraft version wants", () => {
    const old = text(files, "ModItems.java")!
    expect(old).toContain("FuelValueEvents.BUILD.register")
    expect(old).toContain("ComposterBlock.COMPOSTABLES.put(BERRY_DOUGH, 0.65f);")
    const newer = generate(firstItemMod("26.3"), firstItemRegistries())
    expect(text(newer, "ModItems.java")).toContain('.cookingFuel(provider("cooking/time_berry_dough"))')
    expect(JSON.parse(text(newer, "context_int_provider/cooking/time_berry_dough.json")!).left).toBe(100)
    expect(JSON.parse(text(newer, "context_int_provider/compostable/berry_bun.json")!).default).toBe(1)
  })

  it("runs data generation for item models", () => {
    expect(fabricTarget.prepareTasks?.(firstItemMod())).toEqual(["runDatagen"])
    expect(text(files, "ModModelProvider.java")).toContain("items.generateFlatItem(ModItems.BERRY_BUN, ModelTemplates.FLAT_ITEM);")
  })
})
