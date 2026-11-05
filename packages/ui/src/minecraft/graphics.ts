// Drawing primitives for the Minecraft look, on a plain 2D canvas context whose units are
// the game's GUI pixels (the caller scales the context by an integer, with smoothing off).
// Pure functions: no DOM beyond the canvas they are given.
import type { McFont, McSprite } from "./types.ts"

export const TICK_MS = 50

/** The source frame showing at this game tick (animations loop over their sequence). */
export function frameIndexAt(sprite: McSprite, tick: number): number {
  const seq = sprite.sequence
  if (seq.length <= 1) return seq[0]?.index ?? 0
  const total = seq.reduce((sum, f) => sum + f.time, 0)
  let t = ((tick % total) + total) % total
  for (const f of seq) {
    if (t < f.time) return f.index
    t -= f.time
  }
  return seq[0]!.index
}

export const isAnimated = (sprite: McSprite) => sprite.sequence.length > 1

/** Where a frame sits inside the image (frames are stacked top to bottom, then left to right). */
function frameRect(sprite: McSprite, index: number) {
  const perRow = Math.max(1, Math.floor(sprite.width / sprite.frameWidth))
  return { sx: (index % perRow) * sprite.frameWidth, sy: Math.floor(index / perRow) * sprite.frameHeight, sw: sprite.frameWidth, sh: sprite.frameHeight }
}

/** One frame of a sprite, stretched to the box. */
export function drawSprite(ctx: CanvasRenderingContext2D, sprite: McSprite, x: number, y: number, w: number, h: number, tick = 0) {
  const { sx, sy, sw, sh } = frameRect(sprite, frameIndexAt(sprite, tick))
  ctx.drawImage(sprite.image, sx, sy, sw, sh, x, y, w, h)
}

/** A rectangle cut out of a sheet (the 256x256 GUI pictures), drawn at 1:1 unless sized. */
export function drawRegion(ctx: CanvasRenderingContext2D, sprite: McSprite, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw = sw, dh = sh) {
  ctx.drawImage(sprite.image, sx, sy, sw, sh, dx, dy, dw, dh)
}

/** A GUI sprite at any size, following its `gui.scaling`: stretch, tile or nine-slice. */
export function drawGuiSprite(ctx: CanvasRenderingContext2D, sprite: McSprite, x: number, y: number, w: number, h: number, tick = 0) {
  const s = sprite.scaling
  const f = frameRect(sprite, frameIndexAt(sprite, tick))
  const img = sprite.image
  if (s.type === "stretch") return ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, x, y, w, h)

  if (s.type === "tile") {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    for (let ty = 0; ty < h; ty += s.height) for (let tx = 0; tx < w; tx += s.width) ctx.drawImage(img, f.sx, f.sy, Math.min(s.width, f.sw), Math.min(s.height, f.sh), x + tx, y + ty, s.width, s.height)
    ctx.restore()
    return
  }

  // Nine-slice: four fixed corners, four stretched edges, a stretched middle.
  const { left, top, right, bottom } = s.border
  const sw = s.width
  const sh = s.height
  const cols = [
    { sx: 0, sw: left, dx: 0, dw: left },
    { sx: left, sw: sw - left - right, dx: left, dw: w - left - right },
    { sx: sw - right, sw: right, dx: w - right, dw: right },
  ]
  const rows = [
    { sy: 0, sh: top, dy: 0, dh: top },
    { sy: top, sh: sh - top - bottom, dy: top, dh: h - top - bottom },
    { sy: sh - bottom, sh: bottom, dy: h - bottom, dh: bottom },
  ]
  for (const r of rows) for (const c of cols) if (c.sw > 0 && r.sh > 0 && c.dw > 0 && r.dh > 0) ctx.drawImage(img, f.sx + c.sx, f.sy + r.sy, c.sw, r.sh, x + c.dx, y + r.dy, c.dw, r.dh)
}

/**
 * A cube in the usual inventory pose: top face bright, left 80%, right 60% (the game's own
 * face lighting). `size` is the cube's width in GUI pixels (16 in a slot).
 */
export function drawCube(ctx: CanvasRenderingContext2D, faces: { top: McSprite; left: McSprite; right: McSprite }, x: number, y: number, size: number, tick = 0) {
  const s = size
  const face = (sprite: McSprite, origin: [number, number], u: [number, number], v: [number, number], shade: number, poly: [number, number][]) => {
    const { sx, sy, sw, sh } = frameRect(sprite, frameIndexAt(sprite, tick))
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
    ctx.closePath()
    ctx.clip()
    // The texture square (0..sw, 0..sh) is mapped onto the face's two edge vectors.
    ctx.transform(u[0] / sw, u[1] / sw, v[0] / sh, v[1] / sh, origin[0], origin[1])
    ctx.drawImage(sprite.image, sx, sy, sw, sh, 0, 0, sw, sh)
    if (shade < 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - shade})`
      ctx.fillRect(0, 0, sw, sh)
    }
    ctx.restore()
  }
  const q = s / 4
  face(faces.top, [s / 2, 0], [s / 2, q], [-s / 2, q], 1, [[s / 2, 0], [s, q], [s / 2, 2 * q], [0, q]])
  face(faces.left, [0, q], [s / 2, q], [0, s / 2], 0.8, [[0, q], [s / 2, 2 * q], [s / 2, s], [0, 3 * q]])
  face(faces.right, [s / 2, 2 * q], [s / 2, -q], [0, s / 2], 0.6, [[s / 2, 2 * q], [s, q], [s, 3 * q], [s / 2, s]])
}

// ---- Text -----------------------------------------------------------------------------------

/** Pixel width of a line of text in the game's font (without the 1px shadow). */
export function measureText(font: McFont, text: string): number {
  let width = 0
  for (const ch of text) width += font.glyph(ch)?.advance ?? (ch === " " ? 4 : 6)
  return Math.max(0, width - 1)
}

/** Colors dark enough for the shadow: the game draws it at a quarter of the text color. */
function shadowOf(color: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return "#3f3f3f"
  const n = parseInt(m[1]!, 16)
  const q = (v: number) => Math.round(v / 4)
  return `rgb(${q((n >> 16) & 255)},${q((n >> 8) & 255)},${q(n & 255)})`
}

/** One tinted copy of a line of text, 1 game pixel per image pixel (cached by the caller's key). */
function tintedLine(font: McFont, text: string, color: string): HTMLCanvasElement | null {
  const width = measureText(font, text) + 1
  if (width <= 0 || typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = font.lineHeight
  const g = canvas.getContext("2d")!
  g.imageSmoothingEnabled = false
  let pen = 0
  for (const ch of text) {
    const glyph = font.glyph(ch)
    if (glyph) g.drawImage(glyph.sheet.image, glyph.sx, glyph.sy, glyph.width, glyph.height, pen, 0, glyph.width, glyph.height)
    pen += glyph?.advance ?? (ch === " " ? 4 : 6)
  }
  g.globalCompositeOperation = "source-in" // keep the glyph shapes, replace their color
  g.fillStyle = color
  g.fillRect(0, 0, width, canvas.height)
  return canvas
}

const lineCache = new Map<string, HTMLCanvasElement | null>()

/** Draws a line of text with the game's font; `shadow` adds the 1px drop shadow. */
export function drawText(ctx: CanvasRenderingContext2D, font: McFont, text: string, x: number, y: number, color = "#ffffff", shadow = true) {
  const draw = (c: string, dx: number) => {
    const key = `${c}|${text}`
    if (!lineCache.has(key)) {
      if (lineCache.size > 400) lineCache.clear()
      lineCache.set(key, tintedLine(font, text, c))
    }
    const line = lineCache.get(key)
    if (line) ctx.drawImage(line, x + dx, y + dx)
  }
  if (shadow) draw(shadowOf(color), 1)
  draw(color, 0)
}
