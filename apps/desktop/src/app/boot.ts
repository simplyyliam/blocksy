// Start-up: everything that happens once after the first paint.
// The shell renders immediately; settings, projects and Java fill in as they load.
import { getVersion } from "@tauri-apps/api/app"
import { applyTheme } from "@blocksy/ui"
import { useNavigation } from "../shared/stores/navigation"
import { listenToGradle } from "../shared/stores/gradle"
import { useJava } from "../shared/stores/java"
import { useRecent } from "../shared/stores/recent"
import { useSettings } from "../shared/stores/settings"
import { commands } from "../shared/bindings"
import { listenToUpdates } from "../shared/stores/updates"
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

export async function boot() {
  await Promise.all([useSettings.getState().load(), useRecent.getState().load()])
  const settings = useSettings.getState()
  const theme = registries.themes.get(settings.theme)
  if (theme) applyTheme(theme)

  void showWhatsNewAfterUpdate()
  void useJava.getState().detect(settings.javaHome, requiredJava())
  await Promise.all([listenToGradle(), listenToUpdates()])
}
