// Recently opened projects (sidebar "Projects" list and Home).
import { create } from "zustand"
import { loadJson, saveJson } from "./persist"

export interface RecentProject {
  dir: string
  name: string
  minecraftVersion: string
  openedAt: number
}

interface RecentState {
  projects: RecentProject[]
  load(): Promise<void>
  remember(project: Omit<RecentProject, "openedAt">): Promise<void>
  forget(dir: string): Promise<void>
}

const MAX = 12

export const useRecent = create<RecentState>((set, get) => ({
  projects: [],
  async load() {
    const { projects } = await loadJson("recent-projects", { projects: [] as RecentProject[] })
    set({ projects })
  },
  async remember(project) {
    const rest = get().projects.filter((p) => p.dir !== project.dir)
    const projects = [{ ...project, openedAt: Date.now() }, ...rest].slice(0, MAX)
    set({ projects })
    await saveJson("recent-projects", { projects })
  },
  async forget(dir) {
    const projects = get().projects.filter((p) => p.dir !== dir)
    set({ projects })
    await saveJson("recent-projects", { projects })
  },
}))
