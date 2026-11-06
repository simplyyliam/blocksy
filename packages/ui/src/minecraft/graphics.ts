// Drawing primitives for the Minecraft look, on a plain 2D canvas context whose units are
// the game's GUI pixels (the caller scales the context by an integer, with smoothing off).
// Pure functions: no DOM beyond the canvas they are given.
import type { McFont, McSprite, ModelFace, Vec3 } from "./types.ts"

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

// ---- Block models (stairs, slabs, fences, ...) ------------------------------------------------

const rad = (deg: number) => (deg * Math.PI) / 180

/** Turns a point around an axis (degrees), keeping `origin` fixed. */
function turn(p: Vec3, axis: "x" | "y" | "z", angle: number, origin: Vec3): Vec3 {
  const [x, y, z] = [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]]
  const c = Math.cos(rad(angle))
  const s = Math.sin(rad(angle))
  const r: Vec3 = axis === "y" ? [x * c + z * s, y, -x * s + z * c] : axis === "x" ? [x, y * c - z * s, y * s + z * c] : [x * c - y * s, x * s + y * c, z]
  return [r[0] + origin[0], r[1] + origin[1], r[2] + origin[2]]
}

/**
 * The inventory view: the model is centred, turned by the pose (the game's gui display
 * rotation, [30, 225, 0] for blocks) and looked at from the front. Returns screen x, screen y
 * (down) and depth (bigger = nearer the viewer).
 */
export function poseProject(p: Vec3, pose: Vec3): Vec3 {
  const [x, y, z] = [p[0] - 8, p[1] - 8, p[2] - 8]
  const turnY = rad(pose[1] - 180) // 225 in the game's files = a quarter turn plus half a turn in this view
  const tilt = rad(pose[0])
  const x1 = x * Math.cos(turnY) - z * Math.sin(turnY)
  const z1 = x * Math.sin(turnY) + z * Math.cos(turnY)
  const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt)
  const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt)
  return [x1, -y2, z2]
}

const NORMALS: Record<ModelFace["dir"], Vec3> = { up: [0, 1, 0], north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] }
const SHADE: Record<ModelFace["dir"], number> = { up: 1, south: 0.8, north: 0.8, east: 0.6, west: 0.6 }

/** A face's four corners in the order top-left, top-right, bottom-right, bottom-left (as seen from outside). */
function faceCorners(face: ModelFace): [Vec3, Vec3, Vec3, Vec3] {
  const [x0, y0, z0] = face.from
  const [x1, y1, z1] = face.to
  switch (face.dir) {
    case "up":
      return [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
    case "south":
      return [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]]
    case "north":
      return [[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]]
    case "east":
      return [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]]
    case "west":
      return [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]]
  }
}

export interface ProjectedFace {
  face: ModelFace
  /** Screen points of the top-left, top-right, bottom-right and bottom-left corners (model units). */
  points: [Vec3, Vec3, Vec3, Vec3]
  depth: number
  facing: boolean
}

/** Every face of a model in screen space, far to near. `facing` is false for faces turned away. */
export function projectModel(faces: ModelFace[], pose: Vec3): ProjectedFace[] {
  return faces
    .map((face) => {
      const turned = (p: Vec3) => (face.rotation ? turn(p, face.rotation.axis, face.rotation.angle, face.rotation.origin) : p)
      const points = faceCorners(face).map((c) => poseProject(turned(c), pose)) as ProjectedFace["points"]
      const n = NORMALS[face.dir]
      const rotated = face.rotation ? turn(n, face.rotation.axis, face.rotation.angle, [0, 0, 0]) : n
      const facing = poseProject([rotated[0] + 8, rotated[1] + 8, rotated[2] + 8], pose)[2] - poseProject([8, 8, 8], pose)[2] > 0.001
      return { face, points, depth: points.reduce((s, p) => s + p[2], 0) / 4, facing }
    })
    .sort((a, b) => a.depth - b.depth)
}

/** The screen box of a whole 16x16x16 block in this pose: every model is fitted using it, so a stair sits where a block would. */
function blockBox(pose: Vec3) {
  const xs: number[] = []
  const ys: number[] = []
  for (const x of [0, 16]) for (const y of [0, 16]) for (const z of [0, 16]) {
    const p = poseProject([x, y, z], pose)
    xs.push(p[0])
    ys.push(p[1])
  }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

/**
 * A block model in the inventory pose, drawn face by face with the game's own face shading.
 * `size` is the width of a whole block in GUI pixels (16 in a slot); the picture is centred in the box.
 */
export function drawModel(ctx: CanvasRenderingContext2D, faces: ModelFace[], pose: Vec3, sprite: (id: string) => McSprite | null, x: number, y: number, size: number, tick = 0, note?: (s: McSprite) => void) {
  const box = blockBox(pose)
  const scale = size / Math.max(box.maxX - box.minX, box.maxY - box.minY)
  const ox = x + size / 2 - ((box.minX + box.maxX) / 2) * scale
  const oy = y + size / 2 - ((box.minY + box.maxY) / 2) * scale
  const toScreen = (p: Vec3): [number, number] => [ox + p[0] * scale, oy + p[1] * scale]

  for (const { face, points, facing } of projectModel(faces, pose)) {
    if (!facing) continue
    const tex = sprite(face.texture)
    if (!tex) continue
    note?.(tex)
    const { sx, sy, sw, sh } = frameRect(tex, frameIndexAt(tex, tick))
    const [tl, tr, br, bl] = points.map(toScreen) as [[number, number], [number, number], [number, number], [number, number]]
    const [u1, v1, u2, v2] = face.uv
    // The texture rectangle's corners, turned by the face's uv rotation.
    const corners: [number, number][] = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]]
    const steps = face.uvRotation / 90
    const at = (k: number) => {
      const c = corners[(k + steps) % 4]!
      return [(c[0] / 16) * sw, (c[1] / 16) * sh] as [number, number]
    }
    const [aTL, aTR, aBL] = [at(0), at(1), at(3)]
    // Where the texture's axes point on screen: solve the map that sends the texture corners to the
    // face corners (the face is a parallelogram, so an affine map is exact).
    const ax = aTR[0] - aTL[0]
    const ay = aTR[1] - aTL[1]
    const bx = aBL[0] - aTL[0]
    const by = aBL[1] - aTL[1]
    const sx1 = tr[0] - tl[0]
    const sy1 = tr[1] - tl[1]
    const tx1 = bl[0] - tl[0]
    const ty1 = bl[1] - tl[1]
    const det = ax * by - bx * ay
    if (Math.abs(det) < 1e-6) continue
    const m11 = (sx1 * by - tx1 * ay) / det
    const m12 = (tx1 * ax - sx1 * bx) / det
    const m21 = (sy1 * by - ty1 * ay) / det
    const m22 = (ty1 * ax - sy1 * bx) / det
    const path = () => {
      ctx.beginPath()
      ctx.moveTo(tl[0], tl[1])
      ctx.lineTo(tr[0], tr[1])
      ctx.lineTo(br[0], br[1])
      ctx.lineTo(bl[0], bl[1])
      ctx.closePath()
    }
    ctx.save()
    path()
    ctx.clip()
    ctx.save()
    ctx.transform(m11, m21, m12, m22, tl[0] - m11 * aTL[0] - m12 * aTL[1], tl[1] - m21 * aTL[0] - m22 * aTL[1])
    ctx.drawImage(tex.image, sx, sy, sw, sh, 0, 0, sw, sh)
    ctx.restore()
    if (face.tinted) {
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = "#79c05a" // plains grass green: the game tints by biome, a fixed colour keeps the picture steady
      path()
      ctx.fill()
      ctx.globalCompositeOperation = "source-over"
    }
    const shade = SHADE[face.dir]
    if (shade < 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - shade})`
      path()
      ctx.fill()
    }
    ctx.restore()
  }
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
