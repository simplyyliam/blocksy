// User settings (the Settings panel, in both windows): Java path, default project folder, theme, UI scale.
import { create } from "zustand"
import { commands } from "../bindings"
import { call } from "../api"
import { parentPath } from "../paths"
import { announce } from "../sync"
import { loadJson, saveJson } from "./persist"

export interface Settings {
  /** JDK folder chosen by the user; null = pick the best detected one. */
  javaHome: string | null
  /** Where new projects go; null = ~/Blocksy. */
  projectsDir: string | null
  theme: string
  /** Whole-window zoom: 0.9, 1, 1.1, 1.25 ... (applied with the webview zoom). */
  uiScale: number
  /** The app version whose "What's new" was last shown; null on a fresh install. */
  lastSeenVersion: string | null
}

const defaults: Settings = { javaHome: null, projectsDir: null, theme: "modern", uiScale: 1, lastSeenVersion: null }

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
    const { javaHome, projectsDir, theme, uiScale, lastSeenVersion } = get()
    await saveJson("settings", { javaHome, projectsDir, theme, uiScale, lastSeenVersion })
    announce("settings-changed") // the other window loads it again
  },
}))
