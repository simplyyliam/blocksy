// What the welcome window shows: which view is open, plus the two full-window flows
// (New project) and dialogs (Clone) that sit on top of Projects.
import { create } from "zustand"
import { takeWelcomeIntent } from "../windows"

export type WelcomeView = "projects" | "learn" | "community" | "settings"

interface WelcomeState {
  view: WelcomeView
  /** The New project view replaces the whole body (like JetBrains' New Project dialog). */
  creating: boolean
  cloning: boolean
  /** Asked for by File > Open... in the editor: the Projects view opens the folder picker once. */
  pendingOpen: boolean
  setView(view: WelcomeView): void
  setCreating(creating: boolean): void
  setCloning(cloning: boolean): void
  clearPendingOpen(): void
}

// File > New Project... / Open... in the editor bring the welcome window back with a one-shot intent.
const intent = takeWelcomeIntent()

export const useWelcome = create<WelcomeState>((set) => ({
  view: "projects",
  creating: intent === "new",
  cloning: false,
  pendingOpen: intent === "open",
  // Leaving New project by picking another view cancels it.
  setView: (view) => set({ view, creating: false }),
  setCreating: (creating) => set(creating ? { creating, view: "projects" } : { creating }),
  setCloning: (cloning) => set({ cloning }),
  clearPendingOpen: () => set({ pendingOpen: false }),
}))
