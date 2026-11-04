import { describe, expect, it } from "vitest"
import { tagDefaults, tagFilePath, tagSchema } from "./schema.ts"

describe("tag element", () => {
  it("defaults to a new, empty item tag", () => {
    expect(tagSchema.parse(tagDefaults())).toEqual(tagDefaults())
  })

  it("files new tags under the mod and existing ones under their namespace", () => {
    expect(tagFilePath(tagDefaults(), "fruits", "berry_mod")).toBe("berry_mod/tags/item/fruits.json")
    expect(tagFilePath({ ...tagDefaults(), target: "c:foods/fruit" }, "fruits", "berry_mod")).toBe("c/tags/item/foods/fruit.json")
    expect(tagFilePath({ ...tagDefaults(), registry: "block", target: "minecraft:logs" }, "x", "m")).toBe("minecraft/tags/block/logs.json")
  })

  it("refuses tags Blocksy already fills from the block Tool setting", () => {
    expect(tagSchema.safeParse({ registry: "block", target: "minecraft:mineable/pickaxe", values: [] }).success).toBe(false)
    expect(tagSchema.safeParse({ registry: "item", target: "minecraft:mineable/pickaxe", values: [] }).success).toBe(true)
    expect(tagSchema.safeParse({ registry: "item", target: "Not A Tag", values: [] }).success).toBe(false)
  })
})
