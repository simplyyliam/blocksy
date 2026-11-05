// Re-renders a component when anything a command's `enabled()` or `checked()` reads can
// have changed: the document (undo/redo), the Gradle task, the panels and the selection.
// Commands read their state from stores at call time, so this hook is the "refresh" signal.
import { useSyncExternalStore } from "react"
import { useEditor } from "../stores/editor"
import { useGradle } from "../stores/gradle"
import { useNavigation } from "../stores/navigation"
import { useProject } from "../stores/project"

export function useCommandState() {
  const documents = useProject((s) => s.current?.documents)
  useSyncExternalStore(
    (cb) => documents?.subscribe(cb) ?? (() => {}),
    () => documents?.get(),
  )
  // Selecting these values is enough: a change in any of them re-renders the caller.
  useGradle((s) => s.task)
  useEditor((s) => `${s.selected}|${s.view}|${s.treeOpen}|${s.inspectorOpen}|${s.tabs.length}`)
  useNavigation((s) => s.bottomPanelOpen)
}
