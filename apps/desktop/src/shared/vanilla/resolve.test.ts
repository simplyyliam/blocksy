import { describe, expect, it } from "vitest"
import { bitmapProviders, cellsOf, modelIdOf, parseMcmeta, resolveItemRender, spriteLayout, splitId, textureEntry, type JsonReader } from "./resolve"

/** A tiny fake "jar": entry path -> parsed JSON. */
const jar = (files: Record<string, unknown>): JsonReader => async (entry) => files[entry] ?? null

describe("ids and paths", () => {
  it("maps ids to jar entries and refuses odd ones", () => {
    expect(textureEntry("minecraft:item/apple")).toBe("assets/minecraft/textures/item/apple.png")
    expect(textureEntry("item/apple")).toBe("assets/minecraft/textures/item/apple.png")
    expect(textureEntry("../../etc/passwd")).toBeNull()
    expect(splitId("Minecraft:Apple")).toBeNull()
  })
})

describe(".mcmeta", () => {
  it("reads animation settings and the frame list", () => {
    const m = parseMcmeta({ animation: { frametime: 4, interpolate: true, frames: [0, { index: 1, time: 10 }] } })
    expect(m.animation).toEqual({ frametime: 4, interpolate: true, width: undefined, height: undefined, frames: [{ index: 0, time: 4 }, { index: 1, time: 10 }] })
  })

  it("reads nine-slice scaling with a single border number", () => {
    const m = parseMcmeta({ gui: { scaling: { type: "nine_slice", width: 20, height: 20, border: 3 } } })
    expect(m.scaling).toEqual({ type: "nine_slice", width: 20, height: 20, border: { left: 3, top: 3, right: 3, bottom: 3 } })
  })

  it("defaults to stretch and survives junk", () => {
    expect(parseMcmeta(null).scaling).toEqual({ type: "stretch" })
    expect(parseMcmeta({ gui: { scaling: { type: "tile" } } }).scaling).toEqual({ type: "stretch" })
  })

  it("cuts a tall strip into square frames (how Blocksy writes animated items)", () => {
    const layout = spriteLayout(16, 64, parseMcmeta({ animation: { frametime: 3 } }))
    expect(layout.frameWidth).toBe(16)
    expect(layout.frameHeight).toBe(16)
    expect(layout.sequence).toHaveLength(4)
  })

  it("keeps a plain texture as one frame", () => {
    expect(spriteLayout(16, 16, parseMcmeta(null)).sequence).toHaveLength(1)
  })
})

describe("item models", () => {
  it("picks the default branch of a switching item definition", () => {
    expect(modelIdOf({ model: { type: "minecraft:condition", on_false: { type: "minecraft:model", model: "minecraft:item/bow" } } })).toBe("minecraft:item/bow")
    expect(modelIdOf({ model: { type: "minecraft:model", model: "minecraft:item/apple" } })).toBe("minecraft:item/apple")
  })

  it("resolves a generated item to its layers", async () => {
    const read = jar({
      "assets/minecraft/items/apple.json": { model: { type: "minecraft:model", model: "minecraft:item/apple" } },
      "assets/minecraft/models/item/apple.json": { parent: "minecraft:item/generated", textures: { layer0: "minecraft:item/apple" } },
      "assets/minecraft/models/item/generated.json": { textures: {} },
    })
    expect(await resolveItemRender(read, "minecraft:apple")).toEqual({ kind: "flat", layers: ["minecraft:item/apple"] })
  })

  it("resolves a block item to a cube, following parents and texture variables", async () => {
    const read = jar({
      "assets/minecraft/items/stone.json": { model: { type: "minecraft:model", model: "minecraft:block/stone" } },
      "assets/minecraft/models/block/stone.json": { parent: "minecraft:block/cube_all", textures: { all: "minecraft:block/stone" } },
      "assets/minecraft/models/block/cube_all.json": {
        parent: "minecraft:block/cube",
        textures: { particle: "#all", down: "#all", up: "#all", north: "#all", east: "#all", south: "#all", west: "#all" },
      },
      "assets/minecraft/models/block/cube.json": {
        elements: [{ faces: { down: { texture: "#down" }, up: { texture: "#up" }, north: { texture: "#north" }, south: { texture: "#south" }, west: { texture: "#west" }, east: { texture: "#east" } } }],
      },
    })
    expect(await resolveItemRender(read, "minecraft:stone")).toEqual({ kind: "cube", top: "minecraft:block/stone", left: "minecraft:block/stone", right: "minecraft:block/stone" })
  })

  it("says unsupported for entity-rendered items instead of guessing", async () => {
    const read = jar({
      "assets/minecraft/items/chest.json": { model: { type: "minecraft:model", model: "minecraft:item/chest" } },
      "assets/minecraft/models/item/chest.json": { parent: "minecraft:builtin/entity" },
    })
    expect(await resolveItemRender(read, "minecraft:chest")).toEqual({ kind: "unsupported" })
  })

  it("does not loop forever on a parent cycle", async () => {
    const read = jar({
      "assets/minecraft/models/item/a.json": { parent: "minecraft:item/b" },
      "assets/minecraft/models/item/b.json": { parent: "minecraft:item/a" },
    })
    expect(await resolveItemRender(read, "minecraft:a")).toEqual({ kind: "unsupported" })
  })
})

describe("font", () => {
  it("finds characters in a bitmap sheet", () => {
    const [p] = bitmapProviders({ providers: [{ type: "bitmap", file: "minecraft:font/ascii.png", height: 8, ascent: 7, chars: ["\u0000AB", " C"] }, { type: "reference", id: "x" }] })
    const cells = cellsOf(p!)
    expect(cells.get("A")).toEqual({ col: 1, row: 0 })
    expect(cells.get("C")).toEqual({ col: 1, row: 1 })
    expect(cells.has(" ")).toBe(false)
  })
})
