// Applies the saved theme and UI scale to this window (start-up, Settings, and when the other window changes them).
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { applyTheme } from "@blocksy/ui"
import { registries } from "../app/modules"
import { useSettings } from "./stores/settings"

export function applySettings() {
  const { theme, uiScale } = useSettings.getState()
  const found = registries.themes.get(theme)
  if (found) applyTheme(found)
  void getCurrentWebview().setZoom(uiScale).catch(() => {}) // not inside Tauri (browser preview)
}
