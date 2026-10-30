// The Minecraft theme: the whole app in a playful block style (plan section 5).
// Deep stone surfaces, wood side panels, grass-green accents, square corners, hard
// pixel shadows and an openly licensed pixel font (Pixelify Sans, SIL OFL 1.1).
// All art is original (scripts/make-pixel-art.mjs); nothing here is Mojang's.
// A theme is token values only: same layout and behaviour as Modern.
import type { Theme } from "@blocksy/core"
import { GRASS_PNG, PLANKS_PNG, STONE_PNG } from "./minecraft-art.generated.ts"

const png = (base64: string) => `url("data:image/png;base64,${base64}")`
/** The pixel outline drawn around raised things (hard, no blur). */
const OUTLINE = "#0e0d10"

export const minecraftTheme: Theme = {
  id: "minecraft",
  name: "Minecraft",
  tokens: {
    // Surfaces: deepslate greys with a hint of purple, so the green accent pops.
    bg: "#1f1d22",
    surface: "#2c2a30",
    "surface-hover": "#37343c",
    "surface-pressed": "#413e47",
    field: "#16151a",
    subtle: "#252329",
    overlay: "rgb(8 7 10 / 0.6)",

    // Text: warm off-white, like paper in a book and quill.
    fg: "#f1ece2",
    "fg-muted": "#aaa3b2",
    "fg-faint": "#6e6875",

    // Lines
    line: "#46424e",
    "line-subtle": "#34313a",

    // Accent and status
    brand: "#5cbf4a", // grass green
    "brand-hover": "#4fae3e",
    "on-brand": "#0f200b",
    focus: "rgb(92 191 74 / 0.55)",
    success: "#6dd35a",
    warning: "#e8b04b",
    danger: "#e2574c",
    project: "#c98a4b", // oak wood

    // Type: a pixel font for the interface; code stays in a clear mono font.
    "font-sans": '"Pixelify Sans", ui-monospace, monospace',
    "font-mono": '"JetBrains Mono Variable", ui-monospace, "Cascadia Mono", Menlo, monospace',
    // Pixel fonts need a little more size to stay readable.
    "text-xs": "13px",
    "text-sm": "14px",
    "text-base": "14px",
    "text-md": "15px",
    "text-lg": "17px",
    "text-xl": "20px",
    "text-2xl": "26px",

    // Shape: square corners everywhere, like blocks.
    "radius-xs": "0px",
    "radius-sm": "0px",
    "radius-md": "0px",
    "radius-lg": "0px",
    "radius-xl": "0px",
    "radius-2xl": "0px",
    "radius-3xl": "0px",
    "radius-4xl": "0px",
    "radius-dialog": "0px",
    "radius-pill": "0px",

    // Depth: hard pixel shadows with a dark outline, no blur.
    "shadow-sm": `0 2px 0 rgb(0 0 0 / 0.4)`,
    "shadow-md": `0 0 0 2px ${OUTLINE}, 4px 4px 0 rgb(0 0 0 / 0.45)`,
    "shadow-lg": `0 0 0 2px ${OUTLINE}, 6px 6px 0 rgb(0 0 0 / 0.45)`,
    "shadow-xl": `0 0 0 3px ${OUTLINE}, 8px 8px 0 rgb(0 0 0 / 0.5)`,
    black: "#000000",
    white: "#ffffff",

    // Motion: snappier, a little game-like.
    "ease-out": "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
    "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",

    // Code colours (Code tab, docs)
    "code-keyword": "#ff8fb1",
    "code-string": "#a6e37a",
    "code-comment": "#7d7686",
    "code-function": "#7cc7ff",
    "code-constant": "#ffcf6b",
    "code-type": "#c9a6ff",

    // Theme art (original pixel textures) and the raised-button bevel
    "texture-app": png(STONE_PNG),
    "texture-panel": png(PLANKS_PNG),
    "texture-edge": png(GRASS_PNG),
    bevel: `inset 2px 2px 0 rgb(255 255 255 / 0.18), inset -2px -2px 0 rgb(0 0 0 / 0.35), 0 0 0 2px ${OUTLINE}`,
    "bevel-pressed": `inset 2px 2px 0 rgb(0 0 0 / 0.35), inset -2px -2px 0 rgb(255 255 255 / 0.1), 0 0 0 2px ${OUTLINE}`,
  },
}
