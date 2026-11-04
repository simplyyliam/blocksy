// Blocksy's default palette: original colour ramps picked for 16x16 pixel art
// (dark -> light in each ramp, like hand-made pixel palettes). Not Minecraft's colours.
import { parseHex, type Color } from "./image.ts"

const HEX = [
  // greys
  "#1b1c22", "#3b3d47", "#666a78", "#9da1ad", "#d4d7de", "#ffffff",
  // earth
  "#3e2a22", "#6b4632", "#9a6a45", "#c99a64", "#ead2a0",
  // greens
  "#1f3b2c", "#2f6b3e", "#4fa04c", "#8fd06a",
  // blues
  "#1f2c5c", "#2f56a8", "#4f93ff", "#a6d0ff",
  // reds and pinks
  "#5c1f2a", "#a8323e", "#e8545a", "#ff9fa1",
  // yellows and oranges
  "#a8601f", "#e8a23a", "#ffd65c",
  // purples
  "#3c2366", "#6e45b8", "#b48cff",
] as const

export const DEFAULT_PALETTE: Color[] = HEX.map((h) => parseHex(h)!)
