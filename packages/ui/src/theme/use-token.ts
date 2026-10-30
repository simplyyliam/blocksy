// Reads a theme token's current value (e.g. "surface" -> "#f0f0f0") for places that
// can't use CSS, like 3D materials. Re-reads when the theme changes (data-theme).
import { useSyncExternalStore } from "react"

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] })
  return () => observer.disconnect()
}

export function useThemeToken(name: string): string {
  return useSyncExternalStore(subscribe, () => getComputedStyle(document.documentElement).getPropertyValue(`--b-${name}`).trim())
}
