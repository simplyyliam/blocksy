// A tiny image model for pixel art. Colours are packed into one number, 0xRRGGBBAA,
// so a pixel is a single value that is easy to compare (fill) and copy (picker).
//
//   PixelImage { width: 16, height: 16, pixels: Uint32Array(256) }
//   pixel (x, y) lives at pixels[y * width + x]
//
// Animated textures are several frames of the same size. Minecraft wants them as one
// tall "strip" image (frame 0 on top), so we convert between the two here.

/** A colour as 0xRRGGBBAA. 0 means fully transparent. */
export type Color = number

export const TRANSPARENT: Color = 0

export interface PixelImage {
  width: number
  height: number
  pixels: Uint32Array
}

/** What a brush paints on: anything that can read and write one pixel. */
export interface PaintSurface {
  width: number
  height: number
  get(x: number, y: number): Color
  set(x: number, y: number, color: Color): void
}

export function createImage(width: number, height: number, fill: Color = TRANSPARENT): PixelImage {
  return { width, height, pixels: new Uint32Array(width * height).fill(fill) }
}

export const cloneImage = (image: PixelImage): PixelImage => ({ ...image, pixels: image.pixels.slice() })

/** A flat image as a paint surface. Out-of-bounds reads give transparent; writes are ignored. */
export function imageSurface(image: PixelImage): PaintSurface {
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < image.width && y < image.height
  return {
    width: image.width,
    height: image.height,
    get: (x, y) => (inside(x, y) ? image.pixels[y * image.width + x]! : TRANSPARENT),
    set: (x, y, color) => {
      if (inside(x, y)) image.pixels[y * image.width + x] = color >>> 0
    },
  }
}

// --- colours ---

export const rgba = (r: number, g: number, b: number, a = 255): Color => ((r << 24) | (g << 16) | (b << 8) | a) >>> 0

export const channels = (c: Color): [number, number, number, number] => [(c >>> 24) & 255, (c >>> 16) & 255, (c >>> 8) & 255, c & 255]

/** "#3a7bd5" or "#3a7bd5ff" -> colour. Returns null for anything else. */
export function parseHex(hex: string): Color | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim())
  if (!m) return null
  return ((parseInt(m[1]!, 16) << 8) | parseInt(m[2] ?? "ff", 16)) >>> 0
}

/** Colour -> "#rrggbb" (alpha left out when opaque, as colour inputs expect). */
export function toHex(c: Color, withAlpha = false): string {
  const hex = (c >>> 0).toString(16).padStart(8, "0")
  return `#${withAlpha ? hex : hex.slice(0, 6)}`
}

/** CSS colour for drawing and swatches. */
export function toCss(c: Color): string {
  const [r, g, b, a] = channels(c)
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
}

// --- RGBA bytes (for PNG and canvas) ---

export function toRgbaBytes(image: PixelImage): Uint8Array {
  const out = new Uint8Array(image.width * image.height * 4)
  image.pixels.forEach((c, i) => out.set(channels(c), i * 4))
  return out
}

export function fromRgbaBytes(width: number, height: number, bytes: ArrayLike<number>): PixelImage {
  const image = createImage(width, height)
  for (let i = 0; i < width * height; i++) {
    image.pixels[i] = rgba(bytes[i * 4]!, bytes[i * 4 + 1]!, bytes[i * 4 + 2]!, bytes[i * 4 + 3]!)
  }
  return image
}

// --- animation strips ---

/** Cuts a tall strip (frames stacked top to bottom) into square frames. */
export function splitFrames(strip: PixelImage): PixelImage[] {
  const size = strip.width
  const count = Math.max(1, Math.floor(strip.height / size))
  return Array.from({ length: count }, (_, f) => ({
    width: size,
    height: size,
    pixels: strip.pixels.slice(f * size * size, (f + 1) * size * size),
  }))
}

/** Stacks square frames into one tall strip, the layout Minecraft reads with a .mcmeta file. */
export function joinFrames(frames: PixelImage[]): PixelImage {
  const size = frames[0]!.width
  const strip = createImage(size, size * frames.length)
  frames.forEach((frame, f) => strip.pixels.set(frame.pixels, f * size * size))
  return strip
}

/** Every distinct visible colour in the frames, most used first (the "texture colours" palette). */
export function usedColors(frames: PixelImage[], limit = 16): Color[] {
  const counts = new Map<Color, number>()
  for (const frame of frames) for (const c of frame.pixels) if ((c & 255) > 0) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c)
}
