// Applies the saved theme and UI scale to this window (start-up, Settings, and when the other window changes them).
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window"
import { applyTheme } from "@blocksy/ui"
import { registries } from "../app/modules"
import { useSettings } from "./stores/settings"
import { windowKind } from "./windows"

/** The welcome window's size at 100% (keep in step with tauri.conf.json). */
const WELCOME_SIZE = { width: 820, height: 640 }

export function applySettings() {
  const { theme, uiScale } = useSettings.getState()
  const found = registries.themes.get(theme)
  if (found) applyTheme(found)
  void getCurrentWebview().setZoom(uiScale).catch(() => {}) // not inside Tauri (browser preview)
  // The welcome window is fixed-size, so it grows and shrinks with the zoom (else content would clip).
  if (windowKind() === "welcome") void getCurrentWindow().setSize(new LogicalSize(Math.round(WELCOME_SIZE.width * uiScale), Math.round(WELCOME_SIZE.height * uiScale))).catch(() => {})
}
