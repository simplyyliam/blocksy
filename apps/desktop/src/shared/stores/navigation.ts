// Which page the editor window shows, plus editor-wide UI toggles (bottom panel, dialogs).
// The editor's only route is the open project (app/router.tsx). This store mirrors the current
// route as a simple `page` and offers go("project"), so features don't need to know URLs.
// The router connects itself here at start-up (connectRouter).
import { create } from "zustand"

/** "none" is the moment before a project is open (the editor window is only ever created for one). */
export type Page = "none" | "project"

interface NavigationState {
  page: Page
  bottomPanelOpen: boolean
  /** Settings is a dialog over the editor (like Claude's settings), not a page. */
  settingsOpen: boolean
  /** The section Settings opens on when asked (for example "java"), else the last one. */
  settingsSection: string | null
  /** The "What's new" dialog after an update (or opened from Settings). */
  whatsNewOpen: boolean
  /** v0.4: the Ctrl+K command palette and the "?" shortcut sheet. */
  paletteOpen: boolean
  shortcutsOpen: boolean
  go(page: Page): void
  setBottomPanel(open: boolean): void
  setSettings(open: boolean, section?: string): void
  setWhatsNew(open: boolean): void
  setPalette(open: boolean): void
  setShortcuts(open: boolean): void
}

/** Set by the router: moves to a URL, and turns a page name into its URL. */
let router: { navigate(to: string): void; pathFor(page: Page): string } | null = null

export function connectRouter(r: NonNullable<typeof router>) {
  router = r
}

/** Which page a URL shows: "/project/..." -> "project". */
export function pageOf(pathname: string): Page {
  return pathname.startsWith("/project") ? "project" : "none"
}

export const useNavigation = create<NavigationState>((set) => ({
  page: "none",
  bottomPanelOpen: false,
  settingsOpen: false,
  settingsSection: null,
  whatsNewOpen: false,
  paletteOpen: false,
  shortcutsOpen: false,
  // Without a router (tests), just remember the page.
  go: (page) => (router ? router.navigate(router.pathFor(page)) : set({ page })),
  setBottomPanel: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setSettings: (settingsOpen, section) => set({ settingsOpen, settingsSection: settingsOpen ? (section ?? null) : null }),
  setWhatsNew: (whatsNewOpen) => set({ whatsNewOpen }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setShortcuts: (shortcutsOpen) => set({ shortcutsOpen }),
}))
