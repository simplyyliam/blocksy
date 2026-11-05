// Paint layers. A texture can have several layers (like Aseprite or Blockbench), each with
// the same frames. What Minecraft reads stays one flat picture (`texture`): the visible
// layers merged, bottom to top. The layers themselves are saved next to it, so reopening the
// project brings them back. Pure functions; the editor keeps the list in state.
import { createImage, joinFrames, splitFrames, TRANSPARENT, type Color, type PixelImage } from "./image.ts"
import { decodePng, encodePng } from "./png.ts"

export interface PaintLayer {
  id: string
  name: string
  visible: boolean
  /** One image per animation frame, all the same size. */
  frames: PixelImage[]
}

/** How a layer is saved in the project: a name, whether it shows, and its frames as a strip PNG. */
export interface StoredLayer {
  name: string
  visible: boolean
  png: string
}

export const MAX_LAYERS = 8

let counter = 0
const newId = () => `layer-${Date.now().toString(36)}-${counter++}`

/** One colour over another ("source over"), both packed 0xRRGGBBAA. */
export function over(top: Color, bottom: Color): Color {
  const ta = top & 255
  if (ta === 255) return top
  if (ta === 0) return bottom
  const ba = bottom & 255
  const outA = ta + (ba * (255 - ta)) / 255
  if (outA === 0) return TRANSPARENT
  const mix = (shift: number) => {
    const t = (top >>> shift) & 255
    const b = (bottom >>> shift) & 255
    return Math.round((t * ta + (b * ba * (255 - ta)) / 255) / outA)
  }
  return (((mix(24) << 24) | (mix(16) << 16) | (mix(8) << 8) | Math.round(outA)) >>> 0)
}

/** The visible layers of one frame merged into one picture (bottom layer first). */
export function flattenFrame(layers: PaintLayer[], frame: number, size: number): PixelImage {
  const out = createImage(size, size)
  for (const layer of layers) {
    if (!layer.visible) continue
    const image = layer.frames[frame]
    if (!image) continue
    for (let i = 0; i < out.pixels.length; i++) out.pixels[i] = over(image.pixels[i]!, out.pixels[i]!)
  }
  return out
}

export const frameCountOf = (layers: PaintLayer[]) => layers[0]?.frames.length ?? 1

export const flattenAll = (layers: PaintLayer[], size: number): PixelImage[] => Array.from({ length: frameCountOf(layers) }, (_, f) => flattenFrame(layers, f, size))

export function singleLayer(frames: PixelImage[]): PaintLayer[] {
  return [{ id: newId(), name: "Layer 1", visible: true, frames }]
}

export function addLayer(layers: PaintLayer[], size: number, above: number): PaintLayer[] {
  if (layers.length >= MAX_LAYERS) return layers
  const layer: PaintLayer = { id: newId(), name: `Layer ${layers.length + 1}`, visible: true, frames: Array.from({ length: frameCountOf(layers) }, () => createImage(size, size)) }
  return [...layers.slice(0, above + 1), layer, ...layers.slice(above + 1)]
}

/** Never removes the last layer. */
export const removeLayer = (layers: PaintLayer[], index: number): PaintLayer[] => (layers.length < 2 ? layers : layers.filter((_, i) => i !== index))

export function moveLayer(layers: PaintLayer[], from: number, to: number): PaintLayer[] {
  if (to < 0 || to >= layers.length || from === to) return layers
  const next = [...layers]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}

export const patchLayer = (layers: PaintLayer[], index: number, patch: Partial<Pick<PaintLayer, "name" | "visible">>): PaintLayer[] =>
  layers.map((l, i) => (i === index ? { ...l, ...patch } : l))

/** A frame added (blank or copied from the one before) or removed in every layer at once. */
export function insertFrame(layers: PaintLayer[], at: number, size: number, copy: boolean): PaintLayer[] {
  return layers.map((l) => {
    const source = l.frames[at]
    const frame = copy && source ? { ...source, pixels: source.pixels.slice() } : createImage(size, size)
    return { ...l, frames: [...l.frames.slice(0, at + 1), frame, ...l.frames.slice(at + 1)] }
  })
}

export const removeFrame = (layers: PaintLayer[], at: number): PaintLayer[] => (frameCountOf(layers) < 2 ? layers : layers.map((l) => ({ ...l, frames: l.frames.filter((_, i) => i !== at) })))

/** Layers to what the project stores. */
export const storeLayers = (layers: PaintLayer[]): StoredLayer[] => layers.map((l) => ({ name: l.name, visible: l.visible, png: encodePng(joinFrames(l.frames)) }))

/** Stored layers back to editable ones; null if they are damaged or the wrong size. */
export async function loadLayers(stored: StoredLayer[], size: number): Promise<PaintLayer[] | null> {
  try {
    const layers: PaintLayer[] = []
    for (const s of stored) {
      const strip = await decodePng(s.png)
      if (strip.width !== size) return null
      layers.push({ id: newId(), name: s.name, visible: s.visible, frames: splitFrames(strip) })
    }
    const count = layers[0]?.frames.length
    return layers.length > 0 && layers.every((l) => l.frames.length === count) ? layers : null
  } catch {
    return null
  }
}
