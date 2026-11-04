// Brushes: the painting tools. Each one is a small object with an `apply` function that
// changes a PaintSurface at one point. They are reusable on purpose (ADR 0009):
//
//   texture editor (v0.3) ──┐
//                           ├── brush.apply(surface, x, y, options)
//   Model Studio    (v0.5) ──┘   (a surface that maps model faces to texture pixels)
//
// A drag is turned into a line of points first (strokePoints), so fast mouse moves leave
// no gaps. The mirror modifier copies each point to the other side before painting.
import { TRANSPARENT, type Color, type PaintSurface } from "./image.ts"

export interface BrushOptions {
  /** The colour to paint with. */
  color: Color
}

/** What a brush hands back: the picker returns the colour it found. */
export interface BrushResult {
  picked?: Color
}

export interface Brush {
  id: "pencil" | "eraser" | "fill" | "picker"
  name: string
  /** Single-key shortcut shown in tooltips (like Aseprite and Blockbench use). */
  shortcut: string
  /** True: applied at every point while dragging. False: once per click. */
  continuous: boolean
  /** True: the mirror modifier applies (painting tools, not the picker). */
  mirrors: boolean
  apply(surface: PaintSurface, x: number, y: number, options: BrushOptions): BrushResult | void
}

/** Pencil: sets one pixel to the colour. */
export const pencil: Brush = {
  id: "pencil",
  name: "Pencil",
  shortcut: "B",
  continuous: true,
  mirrors: true,
  apply: (surface, x, y, { color }) => surface.set(x, y, color),
}

/** Eraser: makes one pixel transparent. */
export const eraser: Brush = {
  id: "eraser",
  name: "Eraser",
  shortcut: "E",
  continuous: true,
  mirrors: true,
  apply: (surface, x, y) => surface.set(x, y, TRANSPARENT),
}

/**
 * Fill (paint bucket): recolours the connected area of the same colour.
 * "Connected" = touching on a side (not diagonally), like most pixel editors.
 */
export const fill: Brush = {
  id: "fill",
  name: "Fill",
  shortcut: "G",
  continuous: false,
  mirrors: true,
  apply(surface, x, y, { color }) {
    if (x < 0 || y < 0 || x >= surface.width || y >= surface.height) return
    const target = surface.get(x, y)
    if (target === color) return
    // An explicit stack instead of recursion, so a big area can't overflow the call stack.
    const stack: [number, number][] = [[x, y]]
    while (stack.length > 0) {
      const [px, py] = stack.pop()!
      if (px < 0 || py < 0 || px >= surface.width || py >= surface.height) continue
      if (surface.get(px, py) !== target) continue
      surface.set(px, py, color)
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1])
    }
  },
}

/** Picker (eyedropper): reads the colour under the cursor. */
export const picker: Brush = {
  id: "picker",
  name: "Picker",
  shortcut: "I",
  continuous: false,
  mirrors: false,
  apply: (surface, x, y) => ({ picked: surface.get(x, y) }),
}

/** Every brush, in toolbar order. */
export const BRUSHES: Brush[] = [pencil, eraser, fill, picker]

export interface Mirror {
  /** Copy across the vertical centre line (left <-> right). */
  x: boolean
  /** Copy across the horizontal centre line (top <-> bottom). */
  y: boolean
}

/** The point plus its mirrored copies (no duplicates on the centre line). */
export function mirrorPoints(x: number, y: number, width: number, height: number, mirror: Mirror): [number, number][] {
  const points: [number, number][] = [[x, y]]
  const mx = width - 1 - x
  const my = height - 1 - y
  if (mirror.x) points.push([mx, y])
  if (mirror.y) points.push([x, my])
  if (mirror.x && mirror.y) points.push([mx, my])
  const seen = new Set<string>()
  return points.filter(([px, py]) => !seen.has(`${px},${py}`) && seen.add(`${px},${py}`))
}

/** Every pixel on the line from a to b (Bresenham), so a fast drag paints a solid line. */
export function strokePoints(ax: number, ay: number, bx: number, by: number): [number, number][] {
  const points: [number, number][] = []
  const dx = Math.abs(bx - ax)
  const dy = -Math.abs(by - ay)
  const sx = ax < bx ? 1 : -1
  const sy = ay < by ? 1 : -1
  let err = dx + dy
  let x = ax
  let y = ay
  for (;;) {
    points.push([x, y])
    if (x === bx && y === by) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
  return points
}

/** Applies a brush at one point, honouring the mirror modifier. Returns the brush's result. */
export function applyBrush(brush: Brush, surface: PaintSurface, x: number, y: number, options: BrushOptions, mirror: Mirror = { x: false, y: false }): BrushResult | void {
  if (!brush.mirrors) return brush.apply(surface, x, y, options)
  let result: BrushResult | void = undefined
  for (const [px, py] of mirrorPoints(x, y, surface.width, surface.height, mirror)) result = brush.apply(surface, px, py, options) ?? result
  return result
}
