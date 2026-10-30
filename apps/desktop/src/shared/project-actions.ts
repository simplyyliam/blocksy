// Build, Run and Export for the open project. Used by the header buttons and the
// project page, so the rules live in one place:
// - no usable JDK -> open the JDK setup screen instead
// - a project's very first build shows the first-build progress screen
// - Export builds first if there's no jar yet
import { save } from "@tauri-apps/plugin-dialog"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { toast } from "@blocksy/ui"
import { commands, type GradleTask } from "./bindings"
import { call, CommandError, errorMessage } from "./api"
import { baseName, joinPath } from "./paths"
import { useGradle, type RunResult } from "./stores/gradle"
import { useJava } from "./stores/java"
import { useNavigation } from "./stores/navigation"
import { useProject } from "./stores/project"
import { syncGeneratedFiles } from "./sync-files"

/** True from the click until Gradle has started, so a double click can't start twice. */
let starting = false

async function start(task: GradleTask): Promise<boolean> {
  const project = useProject.getState().current
  const java = useJava.getState().active
  if (!project || starting || useGradle.getState().task !== null) return false
  if (!java) {
    useNavigation.getState().go("jdk")
    return false
  }
  // No build/ folder yet means Gradle and Minecraft still need downloading.
  const firstBuild = !(await commands.pathExists(joinPath(project.dir, "build")))
  if (!firstBuild) useNavigation.getState().setBottomPanel(true)
  if (firstBuild) useNavigation.getState().go("project")
  starting = true
  try {
    // Write the mod's files from the project first, so the build always matches what you see.
    const { prepare, markPrepared } = await syncGeneratedFiles(project.dir, project.doc)
    await useGradle.getState().start(task, { projectDir: project.dir, javaHome: java.home, modId: project.doc.modId, firstBuild, prepare })
    // Data generation is skipped next time only if this run got past it.
    if (prepare.length > 0) {
      void finished().then(async (r) => {
        if (r.success || (r.task === "run_client" && useGradle.getState().gameLoaded)) await markPrepared()
      })
    }
    return true
  } catch (err) {
    toast.error(errorMessage(err))
    return false
  } finally {
    starting = false
  }
}

export const buildMod = () => start("build")
export const runMod = () => start("run_client")
export const stopTask = () => useGradle.getState().stop()

/** Resolves when the current Gradle task ends. */
function finished(): Promise<RunResult> {
  return new Promise((resolve) => {
    const off = useGradle.subscribe((s) => {
      if (!s.task && s.lastResult) {
        off()
        resolve(s.lastResult)
      }
    })
  })
}

export async function exportMod() {
  const project = useProject.getState().current
  if (!project) return
  const { modId, version } = project.doc
  const destination = await save({
    title: "Export mod",
    defaultPath: `${modId}-${version}.jar`,
    filters: [{ name: "Minecraft mod", extensions: ["jar"] }],
  })
  if (!destination) return

  try {
    // Always build first, so the exported jar matches the project right now.
    if (!(await buildMod())) return
    const result = await finished()
    if (!result.success) return // the status bar already shows why
    await call(commands.exportJar(project.dir, destination))
    toast(`Saved ${baseName(destination)}`, {
      action: { label: "Show", onClick: () => void revealItemInDir(destination) },
    })
  } catch (err) {
    const message = err instanceof CommandError && err.code === "not_found" ? "Build the mod before exporting" : errorMessage(err)
    toast.error(message)
  }
}
