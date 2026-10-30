// Turns the dialog's answers into a real project folder:
// project data -> generator -> files on disk -> blocksy.json -> open it.
import { createProject, serializeProject, type NewProjectInput } from "@blocksy/core"
import { fileTree, generate } from "@blocksy/generator"
import { registries } from "../../app/modules"
import { commands } from "../../shared/bindings"
import { call } from "../../shared/api"
import { joinPath } from "../../shared/paths"
import { PROJECT_FILE, useProject } from "../../shared/stores/project"
import { applyStarter, type StarterId } from "./starters"

/** Plumbing files the preview leaves out, so it stays readable (add-project.png). */
const HIDDEN = /^(\.gitignore|gradlew(\.bat)?|gradle\/wrapper\/.*)$/

/** The "What gets created" tree, or null while the answers aren't valid yet. */
export function previewTree(input: NewProjectInput, starter: StarterId = "empty"): string | null {
  try {
    const project = applyStarter(createProject(input), starter)
    const paths = [...generate(project, registries).map((f) => f.path), PROJECT_FILE]
    return fileTree(project.modId, paths, (p) => HIDDEN.test(p))
  } catch {
    return null
  }
}

export async function createAndOpen(input: NewProjectInput & { location: string }, starter: StarterId = "empty"): Promise<string> {
  const project = applyStarter(createProject(input), starter)
  const dir = joinPath(input.location, project.modId)
  if (await commands.pathExists(dir)) throw new Error("A folder with this mod ID already exists there")

  await call(commands.writeProjectFiles(dir, generate(project, registries), false))
  await call(commands.writeTextFile(joinPath(dir, PROJECT_FILE), serializeProject(project)))
  await useProject.getState().open(dir)
  return dir
}
