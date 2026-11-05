// The paint canvas's view: how a picture sits in the window. Pure maths, no DOM.
//   zoom = screen pixels per picture pixel, always a whole number (crisp pixels)
//   pan  = where the picture's top-left corner is, in screen pixels
// Wheel zoom steps through fixed levels and keeps the point under the cursor still.

export interface View {
  zoom: number
  panX: number
  panY: number
}

export const ZOOM_LEVELS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64]

const nearestLevel = (zoom: number) => ZOOM_LEVELS.reduce((best, z) => (Math.abs(z - zoom) < Math.abs(best - zoom) ? z : best), ZOOM_LEVELS[0]!)

/** The biggest whole zoom that fits the picture in the window (with a margin), centered. */
export function fitView(viewW: number, viewH: number, imgW: number, imgH: number, margin = 56): View {
  const fit = Math.min((viewW - margin * 2) / imgW, (viewH - margin * 2) / imgH)
  const zoom = [...ZOOM_LEVELS].reverse().find((z) => z <= fit) ?? 1
  return centered(viewW, viewH, imgW, imgH, zoom)
}

/** 1:1 (one picture pixel per screen pixel), centered. */
export const oneToOne = (viewW: number, viewH: number, imgW: number, imgH: number): View => centered(viewW, viewH, imgW, imgH, 1)

function centered(viewW: number, viewH: number, imgW: number, imgH: number, zoom: number): View {
  return { zoom, panX: Math.round((viewW - imgW * zoom) / 2), panY: Math.round((viewH - imgH * zoom) / 2) }
}

/** One step in (+1) or out (-1) around a screen point, which stays under the cursor. */
export function stepZoom(view: View, direction: 1 | -1, anchorX: number, anchorY: number): View {
  const index = ZOOM_LEVELS.indexOf(nearestLevel(view.zoom))
  const next = ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, index + direction))]!
  if (next === view.zoom) return view
  const ratio = next / view.zoom
  return { zoom: next, panX: Math.round(anchorX - (anchorX - view.panX) * ratio), panY: Math.round(anchorY - (anchorY - view.panY) * ratio) }
}

/** Which picture pixel is under a screen point (may be outside the picture: check `inside`). */
export function toPixel(view: View, sx: number, sy: number): [number, number] {
  return [Math.floor((sx - view.panX) / view.zoom), Math.floor((sy - view.panY) / view.zoom)]
}

export const inside = (x: number, y: number, w: number, h: number) => x >= 0 && y >= 0 && x < w && y < h

/** Keeps at least `keep` screen pixels of the picture in the window, so it can't be lost off-screen. */
export function clampPan(view: View, viewW: number, viewH: number, imgW: number, imgH: number, keep = 48): View {
  const w = imgW * view.zoom
  const h = imgH * view.zoom
  return {
    zoom: view.zoom,
    panX: Math.min(viewW - keep, Math.max(keep - w, view.panX)),
    panY: Math.min(viewH - keep, Math.max(keep - h, view.panY)),
  }
}
