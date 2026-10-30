import { describe, expect, it } from "vitest"
import { blockDefaults, blockSchema } from "./schema.ts"
import { encodePng, pngSize } from "./png.ts"
import { starterTexture } from "./starter-texture.ts"

describe("block element", () => {
  it("has valid defaults that behave like stone", () => {
    const data = blockDefaults()
    expect(blockSchema.parse(data)).toEqual(data)
    expect(data).toMatchObject({ hardness: 1.5, resistance: 6, tool: "pickaxe", requiresTool: true })
  })

  it("accepts only 16x16 PNG textures", () => {
    const tiny = encodePng(8, 8, new Uint8Array(8 * 8 * 4))
    expect(blockSchema.safeParse({ ...blockDefaults(), texture: tiny }).success).toBe(false)
    expect(blockSchema.safeParse({ ...blockDefaults(), texture: "not a png" }).success).toBe(false)
    expect(blockSchema.safeParse({ ...blockDefaults(), texture: null }).success).toBe(true)
  })

  it("rejects values outside Minecraft's ranges", () => {
    expect(blockSchema.safeParse({ ...blockDefaults(), light: 16 }).success).toBe(false)
    expect(blockSchema.safeParse({ ...blockDefaults(), hardness: -1 }).success).toBe(false)
    expect(blockSchema.safeParse({ ...blockDefaults(), sound: "squeak" }).success).toBe(false)
  })
})

describe("png helpers", () => {
  it("writes PNGs whose size can be read back", () => {
    expect(pngSize(encodePng(16, 16, new Uint8Array(16 * 16 * 4)))).toEqual({ width: 16, height: 16 })
    expect(pngSize("aGVsbG8gd29ybGQ=")).toBeNull()
  })

  it("draws the same starter texture every time (original art, deterministic)", () => {
    expect(starterTexture()).toBe(starterTexture())
    expect(pngSize(starterTexture())).toEqual({ width: 16, height: 16 })
  })
})
