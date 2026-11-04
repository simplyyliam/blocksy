// Blocksy's own starter item art, drawn by code (original, never Mojang's). Deterministic:
// the same call always gives the same PNG, so golden tests can rely on it.
//   berryDoughTexture: a pale lump of dough dotted with berries
//   berryBunTexture:   a golden bun with berries on top; two frames, the second with a
//                      wisp of steam, to show off animated textures (.mcmeta)
import { createImage, encodePng, imageSurface, joinFrames, rgba, type Color, type PixelImage } from "@blocksy/pixel"

type Ramp = [Color, Color, Color, Color] // outline, shadow, base, highlight

const DOUGH: Ramp = [rgba(122, 92, 64), rgba(214, 186, 146), rgba(240, 222, 186), rgba(255, 246, 224)]
const BUN: Ramp = [rgba(92, 52, 24), rgba(176, 102, 44), rgba(220, 150, 70), rgba(250, 206, 128)]
const BERRY = rgba(200, 40, 60)
const BERRY_LIGHT = rgba(255, 120, 130)
const STEAM = rgba(255, 255, 255, 150)

/** A shaded blob: an ellipse with an outline, darker bottom-right and a highlight top-left. */
function blob(ramp: Ramp, cx: number, cy: number, rx: number, ry: number): PixelImage {
  const image = createImage(16, 16)
  const s = imageSurface(image)
  const inside = (x: number, y: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!inside(x, y)) continue
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
      const shade = (x + 0.5 - cx) / rx + (y + 0.5 - cy) / ry // -2 (top-left) .. 2 (bottom-right)
      s.set(x, y, edge ? ramp[0] : shade > 0.7 ? ramp[1] : shade < -0.9 ? ramp[3] : ramp[2])
    }
  }
  return image
}

export function berryDoughTexture(): string {
  const image = blob(DOUGH, 8, 9.5, 6.5, 4.5)
  const s = imageSurface(image)
  for (const [x, y] of [[5, 8], [9, 7], [11, 10], [7, 11]] as const) s.set(x, y, BERRY)
  s.set(9, 6, BERRY_LIGHT)
  return encodePng(image)
}

export function berryBunTexture(): { png: string; frames: number } {
  const frame = blob(BUN, 8, 9.5, 7, 5)
  const s = imageSurface(frame)
  // A row of berries on top, each with a light dot.
  for (const x of [5, 8, 11]) {
    s.set(x, 6, BERRY)
    s.set(x + 1, 6, BERRY)
    s.set(x, 7, BERRY)
    s.set(x + 1, 7, BERRY)
    s.set(x, 6, BERRY_LIGHT)
  }
  // Frame 2: the same bun with a wisp of steam above it.
  const steamy = { ...frame, pixels: frame.pixels.slice() }
  const t = imageSurface(steamy)
  for (const [x, y] of [[7, 3], [8, 2], [8, 1], [10, 3], [11, 2]] as const) t.set(x, y, STEAM)
  return { png: encodePng(joinFrames([frame, steamy])), frames: 2 }
}
