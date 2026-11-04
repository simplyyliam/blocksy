import { describe, expect, it } from "vitest"
import { createProject } from "@blocksy/core"
import { createImage, encodePng, pngSize } from "@blocksy/pixel"
import { itemElement } from "./element.ts"
import { foodDefaults, itemDefaults, itemSchema } from "./schema.ts"
import { berryBunTexture, berryDoughTexture } from "./starter-art.ts"

describe("item element", () => {
  it("has valid defaults", () => {
    expect(itemSchema.parse(itemDefaults())).toEqual(itemDefaults())
    expect(itemSchema.parse({ ...itemDefaults(), food: foodDefaults() }).food?.nutrition).toBe(5)
  })

  it("accepts 16x16 textures and 16-wide strips only", () => {
    const ok = (w: number, h: number) => itemSchema.safeParse({ ...itemDefaults(), texture: encodePng(createImage(w, h)) }).success
    expect(ok(16, 16)).toBe(true)
    expect(ok(16, 48)).toBe(true)
    expect(ok(16, 20)).toBe(false)
    expect(ok(32, 32)).toBe(false)
  })

  it("rejects values outside Minecraft's ranges", () => {
    expect(itemSchema.safeParse({ ...itemDefaults(), maxStackSize: 100 }).success).toBe(false)
    expect(itemSchema.safeParse({ ...itemDefaults(), compostChance: 1.5 }).success).toBe(false)
    expect(itemSchema.safeParse({ ...itemDefaults(), food: { ...foodDefaults(), effects: [{ effect: "flying", seconds: 1, amplifier: 0, chance: 1 }] } }).success).toBe(false)
  })

  it("lists its translation keys, one per tooltip line", () => {
    const project = createProject({ name: "Berry Mod", target: "fabric", minecraftVersion: "26.1.2" })
    const item = { id: "berry_bun", type: "item", name: "Berry Bun", data: { ...itemDefaults(), tooltip: ["Warm", "Sweet"] } }
    expect(itemElement.lang!(item, project)).toEqual({
      "item.berry_mod.berry_bun": "Berry Bun",
      "item.berry_mod.berry_bun.tooltip.0": "Warm",
      "item.berry_mod.berry_bun.tooltip.1": "Sweet",
    })
  })

  it("draws the same original starter art every time", () => {
    expect(berryDoughTexture()).toBe(berryDoughTexture())
    expect(pngSize(berryDoughTexture())).toEqual({ width: 16, height: 16 })
    expect(pngSize(berryBunTexture().png)).toEqual({ width: 16, height: 32 })
  })
})
