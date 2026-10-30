// Tiny PNG helpers with no dependencies, so they run the same in the app and in tests.
// - pngSize reads the width and height from a PNG's header (to check "16x16").
// - encodePng writes RGBA pixels as a PNG (for the built-in starter texture).
// Textures are stored in the project as base64 text, so the generator stays pure.

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
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
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  // Bytes 12-15 are the first chunk's name; it must be IHDR, which holds the size.
  if (String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") return null
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

/** A PNG data URL for <img> and the 3D preview. */
export const pngDataUrl = (base64: string) => `data:image/png;base64,${base64}`

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

/**
 * Encodes RGBA pixels (width*height*4 bytes) as a base64 PNG. Uses zlib "stored"
 * blocks (no compression): a 16x16 texture is only ~1 KB, so it doesn't matter.
 */
export function encodePng(width: number, height: number, rgba: Uint8Array): string {
  // Each row starts with filter byte 0 ("none").
  const raw: number[] = []
  for (let y = 0; y < height; y++) {
    raw.push(0)
    for (let i = 0; i < width * 4; i++) raw.push(rgba[y * width * 4 + i]!)
  }
  const rawBytes = new Uint8Array(raw)
  const zlib: number[] = [0x78, 0x01]
  for (let pos = 0; pos < rawBytes.length || pos === 0; pos += 65535) {
    const block = rawBytes.slice(pos, pos + 65535)
    const last = pos + 65535 >= rawBytes.length ? 1 : 0
    zlib.push(last, block.length & 255, block.length >>> 8, ~block.length & 255, (~block.length >>> 8) & 255, ...block)
  }
  zlib.push(...u32(adler32(rawBytes)))

  const ihdr = [...u32(width), ...u32(height), 8, 6, 0, 0, 0] // 8-bit RGBA
  const png = [...SIGNATURE, ...chunk("IHDR", ihdr), ...chunk("IDAT", zlib), ...chunk("IEND", [])]
  return bytesToBase64(new Uint8Array(png))
}
