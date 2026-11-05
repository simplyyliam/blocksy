// One keyboard listener for every command shortcut. Mounted by the project layout.
// Bare keys (N, ?, Delete) never fire while you type; undo and redo stay with the text
// field while one has focus; other Ctrl shortcuts (Save, Palette) work anywhere.
import { useEffect } from "react"
import { useProject } from "../stores/project"
import { commandRegistry, isEnabled, runCommand } from "./registry"
import { isBareShortcut, matchesShortcut } from "./shortcuts"

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]") !== null
}

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return
      const hasProject = useProject.getState().current !== null
      const typing = isTyping(e.target)
      // A dialog or menu open on top owns the keyboard (except Ctrl shortcuts like the palette).
      const overlay = document.querySelector("[role=dialog][data-open], [role=menu][data-open]") !== null
      for (const command of commandRegistry.list()) {
        const keys = [command.keys, ...(command.altKeys ?? [])].filter((k): k is string => Boolean(k))
        const hit = keys.find((k) => matchesShortcut(e, k))
        if (!hit) continue
        if (command.needsProject && !hasProject) continue
        if (typing && (isBareShortcut(hit) || command.skipWhileTyping)) continue
        if (overlay && isBareShortcut(hit)) continue
        if (!isEnabled(command)) continue
        e.preventDefault()
        runCommand(command.id)
        return
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}
