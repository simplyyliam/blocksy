// Which page is showing, plus app-wide UI toggles (bottom panel, dialogs).
import { create } from "zustand"

export type Page = "home" | "project" | "docs" | "settings" | "jdk"

interface NavigationState {
  page: Page
  bottomPanelOpen: boolean
  newProjectOpen: boolean
  go(page: Page): void
  setBottomPanel(open: boolean): void
  setNewProject(open: boolean): void
}

export const useNavigation = create<NavigationState>((set) => ({
  page: "home",
  bottomPanelOpen: false,
  newProjectOpen: false,
  go: (page) => set({ page }),
  setBottomPanel: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setNewProject: (newProjectOpen) => set({ newProjectOpen }),
}))
