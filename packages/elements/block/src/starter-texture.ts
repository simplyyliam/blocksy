// Blocksy's own starter texture: drawn by code, so it is original art (never Mojang's).
// A bevelled tile with a few speckles, like a polished gem block. Deterministic:
// the same palette always gives the same pixels (the golden tests rely on it).
import { encodePng } from "./png.ts"

type Rgb = [number, number, number]

/** A soft blue, Blocksy's brand colour family. */
export const STARTER_PALETTE: Rgb[] = [
  [38, 74, 156], // darkest: bottom/right edge
  [56, 104, 196],
  [80, 147, 255], // base
  [128, 180, 255],
  [196, 222, 255], // lightest: top/left edge and sparkles
]

/** Tiny seeded random numbers (mulberry32), so speckles land in the same place every time. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Draws the 16x16 starter tile and returns it as a base64 PNG. */
export function starterTexture(palette: Rgb[] = STARTER_PALETTE, seed = 7): string {
  const size = 16
  const rand = random(seed)
  const rgba = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let shade = 2 // base colour
      if (x === 0 || y === 0) shade = 4 // light bevel, top and left
      else if (x === size - 1 || y === size - 1) shade = 0 // dark bevel, bottom and right
      else if (x === 1 || y === 1) shade = 3
      else if (x === size - 2 || y === size - 2) shade = 1
      else {
        const r = rand()
        if (r < 0.1) shade = 3 // speckles
        else if (r < 0.18) shade = 1
        else if (r > 0.985) shade = 4 // rare sparkles
      }
      const [red, green, blue] = palette[shade]!
      rgba.set([red, green, blue, 255], (y * size + x) * 4)
    }
  }
  return encodePng(size, size, rgba)
}
