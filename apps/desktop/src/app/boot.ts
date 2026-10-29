// Start-up: everything that happens once after the first paint.
// The shell renders immediately; settings, projects and Java fill in as they load.
import { applyTheme } from "@blocksy/ui"
import { listenToGradle } from "../shared/stores/gradle"
import { useJava } from "../shared/stores/java"
import { useRecent } from "../shared/stores/recent"
import { useSettings } from "../shared/stores/settings"
import { listenToUpdates } from "../shared/stores/updates"
import { registries } from "./modules"

/** The newest Java any supported Minecraft version needs (25 today). */
export const requiredJava = () =>
  Math.max(...registries.loaderTargets.list().flatMap((t) => t.versions.map((v) => v.java)))

export async function boot() {
  await Promise.all([useSettings.getState().load(), useRecent.getState().load()])
  const settings = useSettings.getState()
  const theme = registries.themes.get(settings.theme)
  if (theme) applyTheme(theme)

  void useJava.getState().detect(settings.javaHome, requiredJava())
  await Promise.all([listenToGradle(), listenToUpdates()])
}
