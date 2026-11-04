import { describe, expect, it } from "vitest"
import { createProject } from "@blocksy/core"
import { isValidRef, parseRef, prettyId, resolveRef } from "./refs.ts"
import { VANILLA_ITEMS } from "./vanilla.generated.ts"

const project = {
  ...createProject({ name: "Berry Mod", target: "fabric", minecraftVersion: "26.1.2" }),
  elements: [
    { id: "berry_dough", type: "item", name: "Berry Dough", data: {} },
    { id: "fruits", type: "tag", name: "Fruits", data: { registry: "item", target: null, values: [] } },
    { id: "foods", type: "tag", name: "Foods", data: { registry: "item", target: "c:foods", values: [] } },
  ],
}

describe("references", () => {
  it("parses the four kinds", () => {
    expect(parseRef("minecraft:wheat")).toEqual({ kind: "item", id: "minecraft:wheat" })
    expect(parseRef("#minecraft:planks")).toEqual({ kind: "tag", id: "minecraft:planks" })
    expect(parseRef("berry_dough")).toEqual({ kind: "element", id: "berry_dough" })
    expect(parseRef("#fruits")).toEqual({ kind: "elementTag", id: "fruits" })
  })

  it("resolves to the ids Minecraft reads", () => {
    expect(resolveRef("berry_dough", project)).toBe("berry_mod:berry_dough")
    expect(resolveRef("#fruits", project)).toBe("#berry_mod:fruits")
    expect(resolveRef("#foods", project)).toBe("#c:foods")
    expect(resolveRef("minecraft:wheat", project)).toBe("minecraft:wheat")
    expect(resolveRef("gone", project)).toBeNull()
  })

  it("accepts typed ids and rejects junk", () => {
    expect(isValidRef("c:foods/fruit")).toBe(true)
    expect(isValidRef("#c:ingots/copper")).toBe(true)
    expect(isValidRef("Not An Id")).toBe(false)
  })

  it("knows vanilla items and names them readably", () => {
    expect(VANILLA_ITEMS).toContain("wheat")
    expect(VANILLA_ITEMS).toContain("sweet_berries")
    expect(prettyId("minecraft:sweet_berries")).toBe("Sweet berries")
  })
})
