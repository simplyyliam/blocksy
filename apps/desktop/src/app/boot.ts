// Start-up: everything that happens once after the first paint, in either window (ADR 0020).
// The window renders immediately; settings, projects and Java fill in as they load.
import { getVersion } from "@tauri-apps/api/app"
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { applyTheme } from "@blocksy/ui"
import { useNavigation } from "../shared/stores/navigation"
import { listenToGradle } from "../shared/stores/gradle"
import { useJava } from "../shared/stores/java"
import { useRecent } from "../shared/stores/recent"
import { useSettings } from "../shared/stores/settings"
import { commands } from "../shared/bindings"
import { onChanged } from "../shared/sync"
import { listenToUpdates } from "../shared/stores/updates"
import type { WindowKind } from "../shared/windows"
import { registries } from "./modules"

/** The newest Java any supported Minecraft version needs (25 today). */
export const requiredJava = () =>
  Math.max(...registries.loaderTargets.list().flatMap((t) => t.versions.map((v) => v.java)))

/** Applies the saved theme and UI scale to this window. */
export function applySettings() {
  const { theme, uiScale } = useSettings.getState()
  const found = registries.themes.get(theme)
  if (found) applyTheme(found)
  void getCurrentWebview().setZoom(uiScale).catch(() => {}) // not inside Tauri (browser preview)
}

/**
 * After an update, show "What's new" once. A fresh install only remembers the version
 * (nothing is new yet); the bench never sees the dialog.
 */
async function showWhatsNewAfterUpdate() {
  const version = await getVersion().catch(() => null)
  if (!version || (await benchMode())) return
  const { lastSeenVersion, update } = useSettings.getState()
  if (lastSeenVersion === version) return
  if (lastSeenVersion !== null) useNavigation.getState().setWhatsNew(true)
  await update({ lastSeenVersion: version })
}

const benchMode = () => commands.benchMode().catch(() => null)

export async function boot(kind: WindowKind) {
  await Promise.all([useSettings.getState().load(), useRecent.getState().load()])
  applySettings()

  // The other window changed settings or the project list: load them again.
  onChanged("settings-changed", () => void useSettings.getState().load().then(applySettings))
  onChanged("recent-changed", () => void useRecent.getState().load())

  void useJava.getState().detect(useSettings.getState().javaHome, requiredJava())
  await listenToUpdates()
  // "What's new" shows in the window the app starts in; Gradle belongs to the editor.
  if (kind === "welcome") void showWhatsNewAfterUpdate()
  else await listenToGradle()
}
