// Keeps the two windows (ADR 0020) in step. Settings and the recent list are files in the app data
// folder; a window that changes one says so, and the *other* window loads it again.
// Typed on purpose: only these two names exist.
import { emit, listen } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"

export type SyncEvent = "settings-changed" | "recent-changed"

const me = () => {
  try {
    return getCurrentWindow().label
  } catch {
    return "browser"
  }
}

/** Tells the other window. The payload is the sender's label, so a window ignores its own echo. */
export function announce(name: SyncEvent) {
  void emit(name, me()).catch(() => {}) // not inside Tauri (browser preview): nothing to tell
}

/** Runs `onChange` whenever the other window announces `name`. Returns the stop function. */
export function onChanged(name: SyncEvent, onChange: () => void): () => void {
  let stop: (() => void) | undefined
  let stopped = false
  listen<string>(name, ({ payload }) => payload !== me() && onChange())
    .then((off) => (stopped ? off() : (stop = off)))
    .catch(() => {})
  return () => {
    stopped = true
    stop?.()
  }
}
