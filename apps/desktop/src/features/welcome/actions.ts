// What the welcome window does with projects: open, locate, remove (with Undo), copy the path,
// open by drag and drop. Plain async functions, used by the Projects view, its menus and the
// commands, so every way of doing a thing (click, menu, key, drop) runs the same code.
import { open as pickFolder } from "@tauri-apps/plugin-dialog"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import { toast } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { commands } from "../../shared/bindings"
import { baseName, joinPath, parentPath } from "../../shared/paths"
import { checkProject, problemText } from "../../shared/project-check"
import { useRecent, type RecentProject } from "../../shared/stores/recent"
import { PROJECT_FILE } from "../../shared/stores/project"
import { openEditor } from "../../shared/windows"

/** Opens a project in the editor (the welcome window closes). Says why, in a toast, when it can't. */
export async function openProjectAt(dir: string, known?: RecentProject): Promise<boolean> {
  const problem = await checkProject(known ?? { dir, target: "fabric", minecraftVersion: "" })
  // A folder picked from disk has no recorded version: only the first two checks apply.
  if (problem === "folder-missing" || problem === "file-missing" || (problem === "unsupported" && known)) {
    toast.error(
      problem === "file-missing" ? "This folder isn't a Blocksy project (it has no blocksy.json)" : problemText(problem, known ?? { minecraftVersion: "" }),
    )
    return false
  }
  try {
    await openEditor(dir)
    return true
  } catch (err) {
    toast.error(`Couldn't open project: ${errorMessage(err)}`)
    return false
  }
}

/** "Open folder": pick a project folder and open it. */
export async function openFolder(): Promise<void> {
  const picked = await pickFolder({ directory: true, title: "Open a Blocksy project folder" })
  if (typeof picked === "string") await openProjectAt(picked)
}

/** "Locate…": the folder moved, so point the list entry at its new place. */
export async function locateProject(project: RecentProject): Promise<void> {
  const picked = await pickFolder({ directory: true, title: `Locate ${project.name}`, defaultPath: parentPath(project.dir) || undefined })
  if (typeof picked !== "string") return
  if (!(await commands.pathExists(joinPath(picked, PROJECT_FILE)))) {
    toast.error("That folder has no blocksy.json. Pick the folder that holds your project's files.")
    return
  }
  await useRecent.getState().relocate(project.dir, picked)
  toast(`${project.name} found in ${baseName(picked)}`)
}

/** "Remove from list": only forgets it in Blocksy (the files stay), and offers Undo instead of asking first. */
export async function removeProject(project: RecentProject): Promise<void> {
  await useRecent.getState().forget(project.dir)
  toast(`Removed ${project.name} from the list`, {
    action: { label: "Undo", onClick: () => void useRecent.getState().restore(project) },
  })
}

/** "Remove missing projects (n)" from the list's menu. */
export async function removeMissing(projects: RecentProject[]): Promise<void> {
  if (projects.length === 0) return
  await useRecent.getState().forgetMany(projects.map((p) => p.dir))
  toast(`Removed ${projects.length} missing ${projects.length === 1 ? "project" : "projects"}`, {
    action: {
      label: "Undo",
      onClick: () => void Promise.all(projects.map((p) => useRecent.getState().restore(p))),
    },
  })
}

export const togglePin = (project: RecentProject) => useRecent.getState().setPinned(project.dir, !project.pinned)

export async function copyPath(dir: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(dir)
    toast("Path copied")
  } catch {
    toast.error("Couldn't copy the path")
  }
}

/** Opens the folder in Explorer / Finder. */
export const showInExplorer = (dir: string) => void revealItemInDir(dir).catch((err) => toast.error(errorMessage(err)))

/**
 * Something was dropped on the window: open the first folder, or the folder of a dropped blocksy.json.
 * A folder without a blocksy.json says it isn't a Blocksy project (from openProjectAt).
 */
export async function openDropped(paths: string[]): Promise<void> {
  const first = paths[0]
  if (!first) return
  const name = baseName(first).toLowerCase()
  const dir = name === PROJECT_FILE ? parentPath(first) : first
  await openProjectAt(dir)
}
