// Colour maths for the colour picker: packed 0xRRGGBBAA colours to and from HSV.
//   hue 0..360, saturation 0..1, value 0..1 (the picker's square is saturation x value).
import { channels, rgba, type Color } from "./image.ts"

export interface Hsv {
  h: number
  s: number
  v: number
}

export function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToRgb({ h, s, v }: Hsv): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export const colorFromHsv = (hsv: Hsv, alpha = 255): Color => rgba(...hsvToRgb(hsv), alpha)

export function hsvOfColor(color: Color): Hsv {
  const [r, g, b] = channels(color)
  return rgbToHsv(r, g, b)
}
