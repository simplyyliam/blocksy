// Which page is showing, plus app-wide UI toggles (bottom panel, dialogs).
import { create } from "zustand"

export type Page = "home" | "project" | "docs" | "jdk"

interface NavigationState {
  page: Page
  bottomPanelOpen: boolean
  newProjectOpen: boolean
  /** Settings is a dialog over the app (like Claude's settings), not a page. */
  settingsOpen: boolean
  go(page: Page): void
  setBottomPanel(open: boolean): void
  setNewProject(open: boolean): void
  setSettings(open: boolean): void
}

export const useNavigation = create<NavigationState>((set) => ({
  page: "home",
  bottomPanelOpen: false,
  newProjectOpen: false,
  settingsOpen: false,
  go: (page) => set({ page }),
  setBottomPanel: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setNewProject: (newProjectOpen) => set({ newProjectOpen }),
  setSettings: (settingsOpen) => set({ settingsOpen }),
}))
