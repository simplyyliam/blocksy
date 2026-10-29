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
    "text-xs": "11px",
    "text-sm": "12px",
    "text-base": "13px", // body and controls
    "text-md": "14px",
    "text-lg": "15px", // dialog titles
    "text-xl": "18px",
    "text-2xl": "22px", // page titles

    // Shape
    "radius-xs": "4px", // project swatch
    "radius-sm": "6px",
    "radius-md": "8px", // pills and nav items
    "radius-lg": "14px", // file tree box, popovers
    "radius-xl": "20px",
    "radius-2xl": "28px",
    "radius-3xl": "36px", // dialogs

    // Depth
    "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.05)",
    "shadow-md": "0 12px 32px -8px rgb(0 0 0 / 0.14), 0 0 0 1px rgb(0 0 0 / 0.04)", // popovers
    "shadow-lg": "0 32px 80px -16px rgb(0 0 0 / 0.20), 0 0 0 1px rgb(0 0 0 / 0.04)", // dialogs

    // Motion
    "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
    "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  },
}
