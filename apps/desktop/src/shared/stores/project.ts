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

/** Where the project file stands: every change is written 300 ms later (status bar: Autosave). */
export interface AutosaveState {
  state: "saved" | "saving" | "error"
  /** When the last write finished (ms since epoch), or null before the first one. */
  at: number | null
}

interface ProjectState {
  current: OpenProject | null
  autosave: AutosaveState
  open(dir: string): Promise<void>
  /** Writes a change that is still waiting for its 300 ms autosave (before closing or switching). */
  flush(): Promise<void>
  close(): void
}

let unsubscribe: (() => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

const save = (dir: string, doc: Project) =>
  call(commands.writeTextFile(joinPath(dir, PROJECT_FILE), serializeProject(doc)))

export const useProject = create<ProjectState>((set, get) => ({
  current: null,
  autosave: { state: "saved", at: null },

  async flush() {
    const { current } = get()
    if (!current || saveTimer === undefined) return
    clearTimeout(saveTimer)
    saveTimer = undefined
    await save(current.dir, current.doc).catch(() => {})
  },

  async open(dir) {
    await get().flush() // leaving another project: its last edit must reach the disk first
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
      set({ autosave: { ...get().autosave, state: "saving" } })
      saveTimer = setTimeout(() => {
        saveTimer = undefined
        // Only report "Saved" if no newer change is waiting: an older write finishing late must not say so.
        const latest = () => get().current?.doc === doc
        void save(dir, doc).then(
          () => latest() && set({ autosave: { state: "saved", at: Date.now() } }),
          () => latest() && set({ autosave: { ...get().autosave, state: "error" } }),
        )
      }, 300)
    })

    set({ current: { dir, doc: project, documents, version, targetName: target.name }, autosave: { state: "saved", at: null } })
    await useRecent.getState().remember({ dir, name: project.name, minecraftVersion: project.minecraftVersion, target: project.target })
    useNavigation.getState().go("project")
  },

  close() {
    unsubscribe?.()
    unsubscribe = null
    set({ current: null })
  },
}))
