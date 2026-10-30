// The Modern theme (default): calm, neutral, soft radii, generous spacing.
// Values come from Liam's Figma designs in docs/design/ (App.png, add-project.png).
// A theme is token values only (plan section 5): it never changes layout or behaviour.
import type { Theme } from "@blocksy/core"

export const modernTheme: Theme = {
  id: "modern",
  name: "Modern",
  tokens: {
    // Surfaces
    bg: "#ffffff", // app background
    surface: "#f0f0f0", // pills, header and status bar chips
    "surface-hover": "#e8e8e8", // hovered pill, active nav item
    "surface-pressed": "#e1e1e1",
    field: "#eeeeee", // text inputs and selects
    subtle: "#f7f7f7", // quiet buttons (Cancel)
    overlay: "rgb(17 17 17 / 0.16)", // behind dialogs

    // Text
    fg: "#1c1c1c",
    "fg-muted": "#858585", // labels like "Projects"
    "fg-faint": "#b0b0b0", // disabled text

    // Lines
    line: "#dedede", // file tree box border
    "line-subtle": "#ebebeb",

    // Accent and status
    brand: "#5093ff", // Create button
    "brand-hover": "#3d84f7",
    "on-brand": "#ffffff",
    focus: "rgb(80 147 255 / 0.45)",
    success: "#2f9e5b",
    warning: "#d98b14",
    danger: "#e5484d",
    project: "#ff8d5c", // default project swatch

    // Type
    "font-sans": '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
    "font-mono": '"JetBrains Mono Variable", ui-monospace, "Cascadia Mono", Menlo, monospace',
    "text-xs": "12px", // small print, log lines
    "text-sm": "13px", // shadcn controls use text-sm, so it is the 13px base too
    "text-base": "13px", // body
    "text-md": "14px",
    "text-lg": "15px", // dialog titles
    "text-xl": "18px",
    "text-2xl": "22px", // page titles

    // Shape
    // Calm corners like Linear and Vercel (6px controls, 8px cards, 12px dialogs).
    // shadcn (base-luma) uses xl..4xl for most controls, so this scale is what keeps
    // buttons, inputs and menus crisp instead of bubbly.
    "radius-xs": "4px", // project swatch
    "radius-sm": "4px",
    "radius-md": "6px", // chips and small buttons
    "radius-lg": "8px", // cards, file tree box
    "radius-xl": "6px", // sidebar rows, tooltips
    "radius-2xl": "6px", // menu and select items
    "radius-3xl": "6px", // inputs, selects, menus, badges
    "radius-4xl": "6px", // buttons
    "radius-dialog": "12px", // dialogs (rounded-dialog)
    "radius-pill": "9999px", // fully round toolbars (rounded-pill)

    // Depth
    "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.05)",
    "shadow-md": "0 12px 32px -8px rgb(0 0 0 / 0.14), 0 0 0 1px rgb(0 0 0 / 0.04)", // popovers
    "shadow-lg": "0 16px 40px -12px rgb(0 0 0 / 0.16), 0 0 0 1px rgb(0 0 0 / 0.04)", // menus
    "shadow-xl": "0 32px 80px -16px rgb(0 0 0 / 0.20), 0 0 0 1px rgb(0 0 0 / 0.04)", // dialogs
    black: "#000000", // only for shadcn overlays (bg-black/30)
    white: "#ffffff",

    // Motion
    "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
    "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",

    // Code colours (Code tab, docs): calm, readable on white.
    "code-keyword": "#c42f6f",
    "code-string": "#2f8a3e",
    "code-comment": "#9a9a9a",
    "code-function": "#2563c9",
    "code-constant": "#b5680b",
    "code-type": "#7a4cc2",

    // Theme art and bevels: Modern has none (the Minecraft theme sets them).
    "texture-app": "none",
    "texture-panel": "none",
    "texture-edge": "none",
    bevel: "none",
    "bevel-pressed": "none",
  },
}
