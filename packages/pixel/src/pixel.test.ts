import { describe, expect, it } from "vitest"
import { applyBrush, eraser, fill, mirrorPoints, pencil, picker, strokePoints } from "./brushes.ts"
import { createImage, imageSurface, joinFrames, parseHex, rgba, splitFrames, toHex, usedColors } from "./image.ts"
import { decodePng, encodePng, pngSize } from "./png.ts"
import { mcmeta, readFrames, writeFrames } from "./texture.ts"

const RED = rgba(255, 0, 0)
const BLUE = rgba(0, 0, 255)

describe("brushes", () => {
  it("pencil and eraser set one pixel", () => {
    const image = createImage(4, 4)
    const s = imageSurface(image)
    pencil.apply(s, 1, 2, { color: RED })
    expect(s.get(1, 2)).toBe(RED)
    eraser.apply(s, 1, 2, { color: RED })
    expect(s.get(1, 2)).toBe(0)
  })

  it("fill recolours only the connected area", () => {
    const image = createImage(4, 4)
    const s = imageSurface(image)
    for (let y = 0; y < 4; y++) s.set(2, y, BLUE) // a wall down column 2
    fill.apply(s, 0, 0, { color: RED })
    expect(s.get(1, 3)).toBe(RED)
    expect(s.get(2, 0)).toBe(BLUE)
    expect(s.get(3, 0)).toBe(0) // other side of the wall is untouched
  })

  it("picker reads a colour and changes nothing", () => {
    const s = imageSurface(createImage(2, 2, BLUE))
    expect(picker.apply(s, 1, 1, { color: RED })).toEqual({ picked: BLUE })
    expect(s.get(1, 1)).toBe(BLUE)
  })

  it("mirror paints the opposite side, without doubles on the centre line", () => {
    expect(mirrorPoints(0, 0, 16, 16, { x: true, y: false })).toEqual([[0, 0], [15, 0]])
    expect(mirrorPoints(1, 2, 16, 16, { x: true, y: true })).toHaveLength(4)
    expect(mirrorPoints(1, 1, 3, 3, { x: true, y: true })).toEqual([[1, 1]])
    const s = imageSurface(createImage(16, 16))
    applyBrush(pencil, s, 3, 5, { color: RED }, { x: true, y: false })
    expect(s.get(12, 5)).toBe(RED)
  })

  it("strokes have no gaps", () => {
    const points = strokePoints(0, 0, 5, 2)
    expect(points[0]).toEqual([0, 0])
    expect(points.at(-1)).toEqual([5, 2])
    expect(points).toHaveLength(6)
  })
})

describe("colours", () => {
  it("round-trips hex", () => {
    expect(toHex(parseHex("#3a7bd5")!)).toBe("#3a7bd5")
    expect(toHex(parseHex("#3a7bd580")!, true)).toBe("#3a7bd580")
    expect(parseHex("nope")).toBeNull()
  })

  it("lists used colours, most common first", () => {
    const image = createImage(2, 2, RED)
    image.pixels[0] = BLUE
    expect(usedColors([image])).toEqual([RED, BLUE])
  })
})

describe("png", () => {
  it("encodes and decodes the same pixels", async () => {
    const image = createImage(16, 32)
    image.pixels[5] = RED
    image.pixels[16 * 20 + 3] = rgba(10, 20, 30, 128)
    const png = encodePng(image)
    expect(pngSize(png)).toEqual({ width: 16, height: 32 })
    const back = await decodePng(png)
    expect([...back.pixels]).toEqual([...image.pixels])
  })

  it("decodes an indexed, compressed PNG (as pixel tools export)", async () => {
    // 2x1 palette PNG (red, transparent blue), deflate-compressed, made by an image tool.
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABAgMAAABtjSJxAAAABlBMVEX/AAAAAP9i8cmhAAAAAXRSTlP/D+UdTQAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII="
    const image = await decodePng(png)
    expect(image.width).toBe(2)
    expect(image.pixels[0]).toBe(RED)
  })

  it("rejects things that aren't PNGs", async () => {
    await expect(decodePng(btoa("hello world, not a png"))).rejects.toThrow("isn't a PNG")
  })
})

describe("animated textures", () => {
  it("splits and joins strips", () => {
    const a = createImage(16, 16, RED)
    const b = createImage(16, 16, BLUE)
    const frames = splitFrames(joinFrames([a, b]))
    expect(frames).toHaveLength(2)
    expect(frames[1]!.pixels[0]).toBe(BLUE)
  })

  it("adds animation settings only for two or more frames", async () => {
    const one = writeFrames([createImage(16, 16)], null)
    expect(one.animation).toBeNull()
    const two = writeFrames([createImage(16, 16), createImage(16, 16, RED)], null)
    expect(two.animation).toEqual({ frametime: 4, interpolate: false })
    expect(pngSize(two.png!)).toEqual({ width: 16, height: 32 })
    expect(await readFrames(two.png, 16)).toHaveLength(2)
    expect(JSON.parse(mcmeta(two.animation!))).toEqual({ animation: { frametime: 4, interpolate: false } })
  })
})
