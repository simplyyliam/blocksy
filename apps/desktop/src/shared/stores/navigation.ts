// Which page is showing, plus app-wide UI toggles (bottom panel, dialogs).
// Pages are react-router routes (app/router.tsx). This store mirrors the current route
// as a simple `page` and offers go("docs") / openDocs(path), so features don't need to
// know URLs. The router connects itself here at start-up (connectRouter).
import { create } from "zustand"

export type Page = "home" | "project" | "docs" | "jdk"

interface NavigationState {
  page: Page
  /** The open Docs page, e.g. "/docs/learn/make-your-first-block". */
  docsPath: string
  bottomPanelOpen: boolean
  newProjectOpen: boolean
  /** Settings is a dialog over the app (like Claude's settings), not a page. */
  settingsOpen: boolean
  /** The "What's new" dialog after an update (or opened from Settings). */
  whatsNewOpen: boolean
  go(page: Page): void
  /** Opens the Docs at a page. */
  openDocs(path: string): void
  setBottomPanel(open: boolean): void
  setNewProject(open: boolean): void
  setSettings(open: boolean): void
  setWhatsNew(open: boolean): void
}

/** Set by the router: moves to a URL, and turns a page name into its URL. */
let router: { navigate(to: string): void; pathFor(page: Page): string } | null = null

export function connectRouter(r: NonNullable<typeof router>) {
  router = r
}

/** Which page a URL shows: "/project/..." -> "project", "/docs/..." -> "docs". */
export function pageOf(pathname: string): Page {
  if (pathname.startsWith("/project")) return "project"
  if (pathname.startsWith("/docs")) return "docs"
  if (pathname.startsWith("/jdk")) return "jdk"
  return "home"
}

export const useNavigation = create<NavigationState>((set) => ({
  page: "home",
  docsPath: "/docs",
  bottomPanelOpen: false,
  newProjectOpen: false,
  settingsOpen: false,
  whatsNewOpen: false,
  // Without a router (tests), just remember the page.
  go: (page) => (router ? router.navigate(router.pathFor(page)) : set({ page })),
  openDocs: (docsPath) => (router ? router.navigate(docsPath) : set({ page: "docs", docsPath })),
  setBottomPanel: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setNewProject: (newProjectOpen) => set({ newProjectOpen }),
  setSettings: (settingsOpen) => set({ settingsOpen }),
  setWhatsNew: (whatsNewOpen) => set({ whatsNewOpen }),
}))
