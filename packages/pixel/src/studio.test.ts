import { describe, expect, it } from "vitest"
import { colorFromHsv, hsvOfColor, hsvToRgb, rgbToHsv } from "./color.ts"
import { createImage, rgba } from "./image.ts"
import { addLayer, flattenFrame, insertFrame, loadLayers, moveLayer, over, patchLayer, removeFrame, removeLayer, singleLayer, storeLayers } from "./layers.ts"
import { clampPan, fitView, stepZoom, toPixel } from "./viewport.ts"

describe("colour maths", () => {
  it("converts primary colours both ways", () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 1, v: 1 })
    expect(rgbToHsv(0, 255, 0).h).toBe(120)
    expect(rgbToHsv(0, 0, 255).h).toBe(240)
    expect(hsvToRgb({ h: 120, s: 1, v: 1 })).toEqual([0, 255, 0])
    expect(hsvToRgb({ h: 0, s: 0, v: 0.5 })).toEqual([128, 128, 128])
  })

  it("round-trips a packed colour", () => {
    const c = rgba(58, 123, 213)
    expect(colorFromHsv(hsvOfColor(c))).toBe(c)
  })
})

describe("viewport", () => {
  it("fits a 16px picture with a whole zoom, centered", () => {
    const v = fitView(800, 600, 16, 16)
    expect(Number.isInteger(v.zoom)).toBe(true)
    expect(v.zoom * 16).toBeLessThanOrEqual(600 - 112)
    expect(v.panX).toBe(Math.round((800 - 16 * v.zoom) / 2))
  })

  it("keeps the point under the cursor still while zooming", () => {
    const before = { zoom: 8, panX: 100, panY: 50 }
    const [px, py] = toPixel(before, 200, 130)
    const after = stepZoom(before, 1, 200, 130)
    expect(after.zoom).toBeGreaterThan(8)
    expect(toPixel(after, 200, 130)).toEqual([px, py])
  })

  it("stops at the ends of the zoom range and keeps the picture reachable", () => {
    expect(stepZoom({ zoom: 1, panX: 0, panY: 0 }, -1, 0, 0).zoom).toBe(1)
    expect(stepZoom({ zoom: 64, panX: 0, panY: 0 }, 1, 0, 0).zoom).toBe(64)
    const lost = clampPan({ zoom: 8, panX: 5000, panY: -5000 }, 800, 600, 16, 16)
    expect(lost.panX).toBeLessThan(800)
    expect(lost.panY).toBeGreaterThan(-16 * 8)
  })
})

describe("layers", () => {
  const size = 2
  const paint = (px: number[]) => ({ width: size, height: size, pixels: Uint32Array.from(px) })

  it("puts an opaque pixel over a lower one and keeps the lower one where the top is clear", () => {
    expect(over(rgba(255, 0, 0), rgba(0, 0, 255))).toBe(rgba(255, 0, 0))
    expect(over(0, rgba(0, 0, 255))).toBe(rgba(0, 0, 255))
  })

  it("flattens visible layers bottom to top and skips hidden ones", () => {
    const red = rgba(255, 0, 0)
    const blue = rgba(0, 0, 255)
    let layers = singleLayer([paint([blue, blue, blue, blue])])
    layers = addLayer(layers, size, 0)
    layers[1]!.frames[0]!.pixels[0] = red
    expect([...flattenFrame(layers, 0, size).pixels]).toEqual([red, blue, blue, blue])
    layers = patchLayer(layers, 1, { visible: false })
    expect([...flattenFrame(layers, 0, size).pixels]).toEqual([blue, blue, blue, blue])
  })

  it("adds, moves and removes layers, but never removes the last one", () => {
    let layers = addLayer(singleLayer([createImage(size, size)]), size, 0)
    const [a, b] = layers.map((l) => l.id)
    layers = moveLayer(layers, 0, 1)
    expect(layers.map((l) => l.id)).toEqual([b, a])
    layers = removeLayer(layers, 0)
    expect(layers).toHaveLength(1)
    expect(removeLayer(layers, 0)).toHaveLength(1)
  })

  it("adds and removes a frame in every layer at once", () => {
    let layers = addLayer(singleLayer([createImage(size, size)]), size, 0)
    layers = insertFrame(layers, 0, size, true)
    expect(layers.every((l) => l.frames.length === 2)).toBe(true)
    layers = removeFrame(layers, 1)
    expect(layers.every((l) => l.frames.length === 1)).toBe(true)
    expect(removeFrame(layers, 0)[0]!.frames).toHaveLength(1) // the last frame stays
  })

  it("saves and loads layers", async () => {
    const layers = singleLayer([paint([rgba(1, 2, 3), 0, 0, rgba(9, 9, 9)])])
    layers[0]!.name = "Base"
    const back = await loadLayers(storeLayers(layers), size)
    expect(back?.[0]?.name).toBe("Base")
    expect([...back![0]!.frames[0]!.pixels]).toEqual([...layers[0]!.frames[0]!.pixels])
  })

  it("refuses layers of the wrong size", async () => {
    expect(await loadLayers(storeLayers(singleLayer([createImage(4, 4)])), 2)).toBeNull()
  })
})
