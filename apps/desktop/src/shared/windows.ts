// The two windows (ADR 0020): which one this code runs in, and how to move between them.
// Rust only creates and closes windows; deciding what to open is done here.
import { getCurrentWindow } from "@tauri-apps/api/window"
import { call } from "./api"
import { commands } from "./bindings"

export type WindowKind = "welcome" | "editor"

/**
 * The window this code runs in. In a plain browser (UI checks with vite) there is no Tauri window:
 * it is the welcome window, or the editor when the URL says `?window=editor`.
 */
export function windowKind(): WindowKind {
  try {
    return getCurrentWindow().label === "editor" ? "editor" : "welcome"
  } catch {
    return new URLSearchParams(location.search).get("window") === "editor" ? "editor" : "welcome"
  }
}

/** What the welcome window should show first when it comes back from the editor. */
export type WelcomeIntent = "new" | "open"

const INTENT_KEY = "blocksy.welcome-intent"

/** Windows of one app share localStorage, so it hands a one-shot "show this first" to the welcome window. */
export function takeWelcomeIntent(): WelcomeIntent | null {
  try {
    const value = localStorage.getItem(INTENT_KEY)
    localStorage.removeItem(INTENT_KEY)
    return value === "new" || value === "open" ? value : null
  } catch {
    return null
  }
}

/** Opens a project in the editor window and closes the welcome window (or switches the editor). */
export const openEditor = (projectDir: string, prepare = false) => call(commands.openEditor({ projectDir, prepare }))

const NOTICE_KEY = "blocksy.welcome-notice"

/** A message the editor leaves for the welcome window (for example why a project could not open). */
export function takeWelcomeNotice(): string | null {
  try {
    const value = localStorage.getItem(NOTICE_KEY)
    localStorage.removeItem(NOTICE_KEY)
    return value
  } catch {
    return null
  }
}

/** Shows the welcome window and closes the editor. */
export function showWelcome(options: { intent?: WelcomeIntent; notice?: string } = {}) {
  try {
    if (options.intent) localStorage.setItem(INTENT_KEY, options.intent)
    if (options.notice) localStorage.setItem(NOTICE_KEY, options.notice)
  } catch {
    // Without storage the welcome window simply starts on Projects.
  }
  return call(commands.showWelcome())
}
