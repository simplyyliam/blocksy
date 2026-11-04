import { describe, expect, it } from "vitest"
import { createProject } from "@blocksy/core"
import { generate } from "@blocksy/generator"
import { registries } from "../../app/modules"
import { applyStarter } from "./starters"

const base = () => createProject({ name: "Berry Mod", target: "fabric", minecraftVersion: "26.1.2" })

describe("starters", () => {
  it("starter item: craft it, cook it, eat it", () => {
    const project = applyStarter(base(), "item")
    const files = generate(project, registries)
    const paths = files.map((f) => f.path)
    expect(paths).toContain("src/main/resources/data/berry_mod/recipe/berry_dough_recipe.json")
    expect(paths).toContain("src/main/resources/data/berry_mod/recipe/berry_bun_smelting.json")
    const items = files.find((f) => f.path.endsWith("ModItems.java"))
    expect(items && "contents" in items && items.contents).toContain(".food(new FoodProperties.Builder().nutrition(6)")
  })

  it("starter block and blank mod still work as before", () => {
    expect(applyStarter(base(), "block").elements.map((e) => e.type)).toEqual(["creative_tab", "block"])
    expect(applyStarter(base(), "empty").elements).toEqual([])
  })
})
