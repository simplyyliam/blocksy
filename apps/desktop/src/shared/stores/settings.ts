// User settings (Settings page): Java path, default project folder, theme.
import { create } from "zustand"
import { commands } from "../bindings"
import { call } from "../api"
import { parentPath } from "../paths"
import { loadJson, saveJson } from "./persist"

export interface Settings {
  /** JDK folder chosen by the user; null = pick the best detected one. */
  javaHome: string | null
  /** Where new projects go; null = ~/Blocksy. */
  projectsDir: string | null
  theme: string
  /** How Home lists projects. */
  homeView: "grid" | "list"
  /** The app version whose "What's new" was last shown; null on a fresh install. */
  lastSeenVersion: string | null
}

const defaults: Settings = { javaHome: null, projectsDir: null, theme: "modern", homeView: "grid", lastSeenVersion: null }

interface SettingsState extends Settings {
  loaded: boolean
  /** ~/Blocksy, used when projectsDir is null. */
  defaultProjectsDir: string | null
  /** The user's home folder, for showing paths as ~/... */
  home: string | null
  load(): Promise<void>
  update(patch: Partial<Settings>): Promise<void>
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...defaults,
  loaded: false,
  defaultProjectsDir: null,
  home: null,
  async load() {
    const [saved, defaultProjectsDir] = await Promise.all([
      loadJson("settings", defaults),
      call(commands.defaultProjectsDir()).catch(() => null),
    ])
    set({ ...saved, defaultProjectsDir, home: defaultProjectsDir && parentPath(defaultProjectsDir), loaded: true })
  },
  async update(patch) {
    set(patch)
    const { javaHome, projectsDir, theme, homeView, lastSeenVersion } = get()
    await saveJson("settings", { javaHome, projectsDir, theme, homeView, lastSeenVersion })
  },
}))
