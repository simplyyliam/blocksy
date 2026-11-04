// PNG reading and writing with no dependencies, so it runs the same in the app and in tests.
// Textures live in the project file as base64 PNG text (ADR 0006), so the editor needs both:
//   decodePng: base64 -> PixelImage   (inflate via the built-in DecompressionStream)
//   encodePng: PixelImage -> base64   (zlib "stored" blocks: no compression, a 16x16 is ~1 KB)
// Decoding covers what pixel-art tools export: 8-bit grey/RGB/RGBA and indexed colour
// (1, 2, 4 or 8 bits) with transparency. Not supported: 16-bit and interlaced images.
import { fromRgbaBytes, toRgbaBytes, type PixelImage } from "./image.ts"

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

/** Width and height of a base64 PNG, or null if it isn't a PNG. */
export function pngSize(base64: string): { width: number; height: number } | null {
  let bytes: Uint8Array
  try {
    bytes = base64ToBytes(base64.slice(0, 64)) // the header is in the first 33 bytes
  } catch {
    return null
  }
  if (bytes.length < 24 || SIGNATURE.some((b, i) => bytes[i] !== b)) return null
  if (String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") return null
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

/** A PNG data URL for <img>. */
export const pngDataUrl = (base64: string) => `data:image/png;base64,${base64}`

// --- decoding ---

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Undoes PNG's per-row filters (none, sub, up, average, paeth). */
function unfilter(raw: Uint8Array, rowBytes: number, height: number, bpp: number): Uint8Array {
  const out = new Uint8Array(rowBytes * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)]!
    const src = y * (rowBytes + 1) + 1
    const dst = y * rowBytes
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? out[dst + i - bpp]! : 0
      const b = y > 0 ? out[dst + i - rowBytes]! : 0
      const c = y > 0 && i >= bpp ? out[dst + i - rowBytes - bpp]! : 0
      const x = raw[src + i]!
      let v: number
      if (filter === 0) v = x
      else if (filter === 1) v = x + a
      else if (filter === 2) v = x + b
      else if (filter === 3) v = x + ((a + b) >> 1)
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
      } else throw new Error("This PNG uses an unknown filter")
      out[dst + i] = v & 255
    }
  }
  return out
}

/** Reads a base64 PNG into a PixelImage. Throws a plain-language error if it can't. */
export async function decodePng(base64: string): Promise<PixelImage> {
  const bytes = base64ToBytes(base64)
  if (SIGNATURE.some((b, i) => bytes[i] !== b)) throw new Error("That file isn't a PNG image")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let width = 0
  let height = 0
  let depth = 0
  let colorType = 0
  let palette: number[][] = []
  let alphas: number[] = []
  const idat: Uint8Array[] = []
  for (let pos = 8; pos + 8 <= bytes.length; ) {
    const length = view.getUint32(pos)
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8))
    const data = bytes.subarray(pos + 8, pos + 8 + length)
    if (type === "IHDR") {
      width = view.getUint32(pos + 8)
      height = view.getUint32(pos + 12)
      depth = data[8]!
      colorType = data[9]!
      if (data[12] !== 0) throw new Error("Interlaced PNGs aren't supported. Save it without interlacing.")
    } else if (type === "PLTE") {
      palette = Array.from({ length: length / 3 }, (_, i) => [data[i * 3]!, data[i * 3 + 1]!, data[i * 3 + 2]!])
    } else if (type === "tRNS") {
      alphas = [...data]
    } else if (type === "IDAT") {
      idat.push(data)
    } else if (type === "IEND") break
    pos += 12 + length
  }
  const channelsPerType: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }
  const channelCount = channelsPerType[colorType]
  if (!channelCount || !width || !height) throw new Error("That PNG is damaged or uses an unknown colour type")
  if (depth === 16) throw new Error("16-bit PNGs aren't supported. Save it as 8-bit.")
  if (depth !== 8 && !(colorType === 3 || colorType === 0)) throw new Error("That PNG's bit depth isn't supported")

  const joined = new Uint8Array(idat.reduce((n, d) => n + d.length, 0))
  idat.reduce((offset, d) => (joined.set(d, offset), offset + d.length), 0)
  const bitsPerPixel = channelCount * depth
  const rowBytes = Math.ceil((width * bitsPerPixel) / 8)
  const rows = unfilter(await inflate(joined), rowBytes, height, Math.max(1, bitsPerPixel >> 3))

  const out = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      const row = y * rowBytes
      let sample = (i: number) => rows[row + x * channelCount + i]!
      if (depth < 8) {
        const bit = x * depth
        const value = (rows[row + (bit >> 3)]! >> (8 - depth - (bit & 7))) & ((1 << depth) - 1)
        sample = () => value
      }
      if (colorType === 3) {
        const index = sample(0)
        const [r = 0, g = 0, b = 0] = palette[index] ?? []
        out.set([r, g, b, alphas[index] ?? 255], o)
      } else if (colorType === 0) {
        const grey = depth < 8 ? Math.round((sample(0) * 255) / ((1 << depth) - 1)) : sample(0)
        out.set([grey, grey, grey, 255], o)
      } else if (colorType === 4) out.set([sample(0), sample(0), sample(0), sample(1)], o)
      else if (colorType === 2) out.set([sample(0), sample(1), sample(2), 255], o)
      else out.set([sample(0), sample(1), sample(2), sample(3)], o)
    }
  }
  return fromRgbaBytes(width, height, out)
}

// --- encoding ---

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function adler32(bytes: Uint8Array): number {
  let a = 1
  let b = 0
  for (const byte of bytes) {
    a = (a + byte) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]

function chunk(type: string, data: number[]): number[] {
  const body = new Uint8Array([...type].map((c) => c.charCodeAt(0)).concat(data))
  return [...u32(data.length), ...body, ...u32(crc32(body))]
}

/** Writes a PixelImage as a base64 RGBA PNG. The same image always gives the same text. */
export function encodePng(image: PixelImage): string {
  const { width, height } = image
  const rgba = toRgbaBytes(image)
  const raw = new Uint8Array(height * (width * 4 + 1)) // each row starts with filter byte 0
  for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  const zlib: number[] = [0x78, 0x01]
  for (let pos = 0; pos < raw.length || pos === 0; pos += 65535) {
    const block = raw.subarray(pos, pos + 65535)
    const last = pos + 65535 >= raw.length ? 1 : 0
    zlib.push(last, block.length & 255, block.length >>> 8, ~block.length & 255, (~block.length >>> 8) & 255, ...block)
  }
  zlib.push(...u32(adler32(raw)))
  const ihdr = [...u32(width), ...u32(height), 8, 6, 0, 0, 0] // 8-bit RGBA
  return bytesToBase64(new Uint8Array([...SIGNATURE, ...chunk("IHDR", ihdr), ...chunk("IDAT", zlib), ...chunk("IEND", [])]))
}
