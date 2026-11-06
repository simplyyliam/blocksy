import { describe, expect, it } from "vitest"
import { bitmapProviders, cellsOf, modelIdOf, parseMcmeta, resolveItemRender, resolveTagItem, spriteLayout, splitId, textureEntry, type JsonReader } from "./resolve"

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

describe("block models with a real shape", () => {
  const stairs = jar({
    "assets/minecraft/items/oak_stairs.json": { model: { type: "minecraft:model", model: "minecraft:block/oak_stairs" } },
    "assets/minecraft/models/block/oak_stairs.json": { parent: "minecraft:block/stairs", textures: { bottom: "minecraft:block/oak_planks", side: "minecraft:block/oak_planks", top: "minecraft:block/oak_planks" } },
    "assets/minecraft/models/block/block.json": { display: { gui: { rotation: [30, 225, 0] } } },
    "assets/minecraft/models/block/stairs.json": {
      parent: "minecraft:block/block",
      textures: { particle: "#side" },
      elements: [
        { from: [0, 0, 0], to: [16, 8, 16], faces: { down: { texture: "#bottom" }, up: { texture: "#top" }, north: { texture: "#side" }, south: { texture: "#side" }, west: { texture: "#side" }, east: { texture: "#side" } } },
        { from: [8, 8, 0], to: [16, 16, 16], faces: { up: { texture: "#top", uv: [8, 0, 16, 16] }, north: { texture: "#side" }, south: { texture: "#side" }, east: { texture: "#side" } } },
      ],
    },
  })

  it("keeps every element of stairs instead of drawing a full cube", async () => {
    const render = await resolveItemRender(stairs, "minecraft:oak_stairs")
    expect(render.kind).toBe("model")
    if (render.kind !== "model") return
    expect(render.pose).toEqual([30, 225, 0])
    // two elements, five drawable directions on the first, four on the second
    expect(render.faces).toHaveLength(9)
    expect(render.faces.every((f) => f.texture === "minecraft:block/oak_planks")).toBe(true)
    expect(render.faces.find((f) => f.dir === "up" && f.to[1] === 16)?.uv).toEqual([8, 0, 16, 16])
  })

  it("gives faces the game's default texture rectangle when the model has no uv", async () => {
    const render = await resolveItemRender(stairs, "minecraft:oak_stairs")
    if (render.kind !== "model") throw new Error("expected a model")
    const south = render.faces.find((f) => f.dir === "south" && f.to[1] === 8)!
    expect(south.uv).toEqual([0, 8, 16, 16])
  })
})

describe("tags", () => {
  const read = jar({
    "data/minecraft/tags/item/planks.json": { values: ["minecraft:oak_planks", "minecraft:spruce_planks"] },
    "data/minecraft/tags/item/logs.json": { values: ["#minecraft:oak_logs", "minecraft:birch_log"] },
    "data/minecraft/tags/item/oak_logs.json": { values: [{ id: "minecraft:oak_log", required: false }] },
  })

  it("draws a tag as its first item, following nested tags", async () => {
    expect(await resolveTagItem(read, "minecraft:planks")).toBe("minecraft:oak_planks")
    expect(await resolveTagItem(read, "#minecraft:logs")).toBe("minecraft:oak_log")
  })

  it("has nothing to show for an unknown tag", async () => {
    expect(await resolveTagItem(read, "minecraft:nothing")).toBeNull()
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
