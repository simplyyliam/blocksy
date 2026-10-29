// Applies a theme by writing its tokens as CSS custom properties (`--b-<name>`)
// on the document root. styles.css maps Tailwind classes onto these variables,
// so switching themes is just writing new values: no re-render, no reload.
import type { Theme } from "@blocksy/core"

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--b-${name}`, value)
  }
  root.dataset.theme = theme.id
}
