// Looks at a listed project before it is opened: is the folder still there, does it still have its
// blocksy.json, and does this Blocksy support its loader and Minecraft version? The welcome window
// uses it to grey out rows ("Folder missing", with Locate) instead of failing on click.
import { registries } from "../app/modules"
import { commands } from "./bindings"
import { joinPath } from "./paths"
import { PROJECT_FILE } from "./stores/project"
import type { RecentProject } from "./stores/recent"

export type ProjectProblem = "folder-missing" | "file-missing" | "unsupported"

/** Pure part: is this loader + Minecraft version one this Blocksy can open? */
export function isSupported(target: string, minecraftVersion: string): boolean {
  return registries.loaderTargets.get(target)?.versions.some((v) => v.minecraft === minecraftVersion) ?? false
}

/** The reason a project can't be opened, or null when it can. */
export async function checkProject(project: Pick<RecentProject, "dir" | "target" | "minecraftVersion">): Promise<ProjectProblem | null> {
  if (!(await commands.pathExists(project.dir))) return "folder-missing"
  if (!(await commands.pathExists(joinPath(project.dir, PROJECT_FILE)))) return "file-missing"
  return isSupported(project.target, project.minecraftVersion) ? null : "unsupported"
}

/** A sentence for a toast or a row. */
export function problemText(problem: ProjectProblem, project: Pick<RecentProject, "minecraftVersion">): string {
  switch (problem) {
    case "folder-missing":
      return "Folder missing"
    case "file-missing":
      return "blocksy.json missing"
    case "unsupported":
      return `Minecraft ${project.minecraftVersion} isn't supported by this Blocksy`
  }
}
