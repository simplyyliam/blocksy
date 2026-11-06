// Recently opened projects: the welcome window's list and the editor's File > Open Recent.
// The list rules are plain functions (tested); the store only loads, saves and tells the other window.
import { create } from "zustand"
import { announce } from "../sync"
import { loadJson, saveJson } from "./persist"

export interface RecentProject {
  dir: string
  name: string
  minecraftVersion: string
  /** Loader target id ("fabric"). Older entries have none: they are Fabric projects. */
  target: string
  openedAt: number
  /** Pinned projects sit on top of the list and never fall off the end. */
  pinned?: boolean
}

/** What the list keeps besides the pinned projects. */
export const MAX_UNPINNED = 30

const sameDir = (a: string, b: string) => a.replaceAll("\\", "/").toLowerCase() === b.replaceAll("\\", "/").toLowerCase()

/** Old saves had no `target`: fill it in. */
export const normalize = (p: Partial<RecentProject> & Pick<RecentProject, "dir" | "name" | "minecraftVersion" | "openedAt">): RecentProject => ({
  ...p,
  target: p.target ?? "fabric",
})

/** Newest first, then the oldest unpinned ones fall off the end. */
export function trim(projects: RecentProject[]): RecentProject[] {
  const sorted = [...projects].sort((a, b) => b.openedAt - a.openedAt)
  let unpinned = 0
  return sorted.filter((p) => p.pinned || ++unpinned <= MAX_UNPINNED)
}

/** Opening a project: it moves to the front (keeping its pin) with a fresh time. */
export function remembered(projects: RecentProject[], project: Omit<RecentProject, "openedAt" | "pinned">, now: number): RecentProject[] {
  const old = projects.find((p) => sameDir(p.dir, project.dir))
  const rest = projects.filter((p) => p !== old)
  return trim([{ ...project, openedAt: now, pinned: old?.pinned }, ...rest])
}

export const forgotten = (projects: RecentProject[], dir: string) => projects.filter((p) => !sameDir(p.dir, dir))

export const pinned = (projects: RecentProject[], dir: string, value: boolean) =>
  projects.map((p) => (sameDir(p.dir, dir) ? { ...p, pinned: value || undefined } : p))

/** "Locate…": the project moved, so its entry points at the new folder (name and pin stay). */
export function relocated(projects: RecentProject[], oldDir: string, newDir: string): RecentProject[] {
  const old = projects.find((p) => sameDir(p.dir, oldDir))
  if (!old) return projects
  // If the new folder is already listed, that duplicate goes.
  return projects.filter((p) => p === old || !sameDir(p.dir, newDir)).map((p) => (p === old ? { ...p, dir: newDir } : p))
}

interface RecentState {
  projects: RecentProject[]
  load(): Promise<void>
  remember(project: Omit<RecentProject, "openedAt" | "pinned">): Promise<void>
  forget(dir: string): Promise<void>
  /** Puts a removed project back (the Undo of "Remove from list"). */
  restore(project: RecentProject): Promise<void>
  forgetMany(dirs: string[]): Promise<void>
  /** Puts several removed projects back in one write (the Undo of "Remove missing projects"). */
  restoreMany(projects: RecentProject[]): Promise<void>
  setPinned(dir: string, value: boolean): Promise<void>
  relocate(oldDir: string, newDir: string): Promise<void>
}

export const useRecent = create<RecentState>((set, get) => {
  /** Saves, then tells the other window. */
  const commit = async (projects: RecentProject[]) => {
    set({ projects })
    await saveJson("recent-projects", { projects })
    announce("recent-changed")
  }
  return {
    projects: [],
    async load() {
      const { projects } = await loadJson("recent-projects", { projects: [] as RecentProject[] })
      set({ projects: trim(projects.map(normalize)) })
    },
    remember: (project) => commit(remembered(get().projects, project, Date.now())),
    forget: (dir) => commit(forgotten(get().projects, dir)),
    forgetMany: async (dirs) => commit(dirs.reduce(forgotten, get().projects)),
    restore: (project) => commit(trim([project, ...forgotten(get().projects, project.dir)])),
    restoreMany: (restored) => commit(trim([...restored, ...restored.reduce((list, p) => forgotten(list, p.dir), get().projects)])),
    setPinned: (dir, value) => commit(pinned(get().projects, dir, value)),
    relocate: (oldDir, newDir) => commit(relocated(get().projects, oldDir, newDir)),
  }
})
