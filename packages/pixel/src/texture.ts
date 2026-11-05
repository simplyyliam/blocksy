// The value the texture editor edits: a PNG (one frame, or a tall strip of frames)
// plus optional animation settings. This is exactly what Minecraft reads:
//   textures/item/<id>.png         the strip, frame 0 on top
//   textures/item/<id>.png.mcmeta  { "animation": { "frametime": 4, "interpolate": false } }
import { createImage, joinFrames, splitFrames, type PixelImage } from "./image.ts"
import type { StoredLayer } from "./layers.ts"
import { decodePng, encodePng } from "./png.ts"

export interface TextureAnimation {
  /** How long each frame shows, in game ticks (20 ticks = 1 second). */
  frametime: number
  /** Blend smoothly between frames instead of jumping. */
  interpolate: boolean
}

export interface TextureValue {
  /** Base64 PNG, width = frame size, height = frame size x frame count. Null = no texture. */
  png: string | null
  /** Null for a still texture. Set once there is more than one frame. */
  animation: TextureAnimation | null
  /** The paint layers behind the flat picture (v0.4), or null/absent for a single layer. */
  layers?: StoredLayer[] | null
}

export const DEFAULT_ANIMATION: TextureAnimation = { frametime: 4, interpolate: false }

/** The frames of a texture value (one empty frame when there is no texture yet). */
export async function readFrames(png: string | null, size: number): Promise<PixelImage[]> {
  if (!png) return [createImage(size, size)]
  return splitFrames(await decodePng(png))
}

/** Frames back to a texture value: a strip PNG, with animation only for 2+ frames. */
export function writeFrames(frames: PixelImage[], animation: TextureAnimation | null): TextureValue {
  return {
    png: encodePng(joinFrames(frames)),
    animation: frames.length > 1 ? (animation ?? DEFAULT_ANIMATION) : null,
  }
}

/** The .mcmeta text Minecraft needs next to an animated texture. */
export const mcmeta = (animation: TextureAnimation) => `${JSON.stringify({ animation }, null, 2)}\n`
