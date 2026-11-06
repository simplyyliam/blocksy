// What the welcome window shows: which view is open, plus the two full-window flows
// (New project) and dialogs (Clone) that sit on top of Projects.
import { create } from "zustand"
import type { SettingsSectionId } from "../../features/settings/settings-sections"
import { takeWelcomeIntent } from "../windows"

export type WelcomeView = "projects" | "learn" | "community" | "settings"

interface WelcomeState {
  view: WelcomeView
  /** The New project view replaces the whole body (like JetBrains' New Project dialog). */
  creating: boolean
  cloning: boolean
  /** The Docs page open in Learn (e.g. "/docs/learn/make-your-first-block"), or null for the lesson list. */
  learnPath: string | null
  /** The Settings section to scroll to on open (so "Set up Java" lands on Java). */
  settingsSection: SettingsSectionId
  /** Asked for by File > Open... in the editor: the Projects view opens the folder picker once. */
  pendingOpen: boolean
  setView(view: WelcomeView): void
  openSettings(section: SettingsSectionId): void
  /** Opens Learn on a Docs page (null = the lesson list). */
  openLearn(path: string | null): void
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
  learnPath: null,
  settingsSection: "general",
  pendingOpen: intent === "open",
  // Leaving New project by picking another view cancels it.
  setView: (view) => set({ view, creating: false, ...(view === "settings" ? { settingsSection: "general" as const } : {}) }),
  openLearn: (learnPath) => set({ view: "learn", creating: false, learnPath }),
  openSettings: (settingsSection) => set({ view: "settings", creating: false, settingsSection }),
  setCreating: (creating) => set(creating ? { creating, view: "projects" } : { creating }),
  setCloning: (cloning) => set({ cloning }),
  clearPendingOpen: () => set({ pendingOpen: false }),
}))
