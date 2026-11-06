// What a status item may do when clicked: show a panel in the current view. Never a new route
// (CLAUDE.md: "The status bar only shows status."). Opens the bottom dock on one of its tabs.
import { useEditor, type DockTab } from "../../shared/stores/editor"
import { useNavigation } from "../../shared/stores/navigation"

export function openDock(tab: DockTab) {
  useEditor.getState().setDockTab(tab)
  useNavigation.getState().setBottomPanel(true)
}
