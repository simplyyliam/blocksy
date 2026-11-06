// The welcome window's commands (same registry as the editor's, ADR 0020 + plan rule "commands
// through the registry"). Shortcuts, and the palette-style lists, read from here.
import { defineCommand } from "../../shared/commands/registry"
import { openFolder } from "./actions"
import { useWelcome, type WelcomeView } from "../../shared/stores/welcome"

let registered = false

const go = (view: WelcomeView) => () => useWelcome.getState().setView(view)

export function registerWelcomeCommands() {
  if (registered) return
  registered = true
  const nav = { group: "Welcome", needsProject: false } as const
  defineCommand({ ...nav, id: "welcome.projects", title: "Projects", keys: "Mod+1", run: go("projects") })
  defineCommand({ ...nav, id: "welcome.learn", title: "Learn", keys: "Mod+2", run: go("learn") })
  defineCommand({ ...nav, id: "welcome.community", title: "Community", keys: "Mod+3", run: go("community") })
  defineCommand({ ...nav, id: "welcome.settings", title: "Settings", keys: "Mod+4", run: go("settings") })
  defineCommand({ ...nav, id: "welcome.new", title: "New project", keys: "Mod+N", keywords: ["create"], run: () => useWelcome.getState().setCreating(true) })
  defineCommand({ ...nav, id: "welcome.open", title: "Open folder", keys: "Mod+O", run: () => openFolder() })
  defineCommand({ ...nav, id: "welcome.clone", title: "Clone from GitHub", keys: "Mod+Shift+O", keywords: ["git"], run: () => {
    useWelcome.getState().setView("projects")
    useWelcome.getState().setCloning(true)
  } })
  defineCommand({ ...nav, id: "welcome.search", title: "Search projects", keys: "Mod+F", run: () => {
    useWelcome.getState().setView("projects")
    // The box may mount a moment later (after a view switch).
    setTimeout(() => document.getElementById("welcome-search")?.focus(), 30)
  } })
}
