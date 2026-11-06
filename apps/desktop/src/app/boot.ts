// Start-up: everything that happens once after the first paint, in either window (ADR 0020).
// The window renders immediately; settings, projects and Java fill in as they load.
import { getVersion } from "@tauri-apps/api/app"
import { applySettings } from "../shared/apply-settings"
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

let markLoaded: () => void
/** Resolves once settings and the recent list are loaded (the editor waits for it before opening a project). */
export const dataLoaded = new Promise<void>((resolve) => (markLoaded = resolve))

export async function boot(kind: WindowKind) {
  await Promise.all([useSettings.getState().load(), useRecent.getState().load()])
  markLoaded()
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
