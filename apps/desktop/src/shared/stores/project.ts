// The open project. Its document lives in a core DocumentStore (commands + undo/redo);
// every change is saved to blocksy.json shortly after it happens.
import { create } from "zustand"
import {
  createDocumentStore,
  loadProject,
  serializeProject,
  type DocumentStore,
  type Project,
  type TargetVersion,
} from "@blocksy/core"
import { registries } from "../../app/modules"
import { commands } from "../bindings"
import { call } from "../api"
import { joinPath } from "../paths"
import { useNavigation } from "./navigation"
import { useRecent } from "./recent"

export const PROJECT_FILE = "blocksy.json"

export interface OpenProject {
  dir: string
  doc: Project
  documents: DocumentStore<Project>
  version: TargetVersion
  /** Loader target display name ("Fabric"), from the registry. */
  targetName: string
}

interface ProjectState {
  current: OpenProject | null
  open(dir: string): Promise<void>
  close(): void
}

let unsubscribe: (() => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

const save = (dir: string, doc: Project) =>
  call(commands.writeTextFile(joinPath(dir, PROJECT_FILE), serializeProject(doc)))

export const useProject = create<ProjectState>((set, get) => ({
  current: null,

  async open(dir) {
    const text = await call(commands.readTextFile(joinPath(dir, PROJECT_FILE)))
    const { project, applied } = loadProject(text)
    const target = registries.loaderTargets.require(project.target)
    const version = target.versions.find((v) => v.minecraft === project.minecraftVersion)
    if (!version) throw new Error(`${target.name} ${project.minecraftVersion} isn't supported by this Blocksy`)
    if (applied.length > 0) await save(dir, project) // upgraded from an older format

    unsubscribe?.()
    const documents = createDocumentStore(project)
    unsubscribe = documents.subscribe((doc) => {
      set({ current: { ...get().current!, doc } })
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => void save(dir, doc), 300)
    })

    set({ current: { dir, doc: project, documents, version, targetName: target.name } })
    await useRecent.getState().remember({ dir, name: project.name, minecraftVersion: project.minecraftVersion })
    useNavigation.getState().go("project")
  },

  close() {
    unsubscribe?.()
    unsubscribe = null
    set({ current: null })
    useNavigation.getState().go("home")
  },
}))
