// The three panel toggles in the titlebar, in VS Code's spatial order: left (explorer),
// bottom (dock), right (inspector). Each shows a pressed state while its panel is open.
// They are the existing window.* commands, so the shortcuts and the Window menu agree.
import { CommandButton } from "../../shared/commands/command-button"

export function PanelToggles() {
  return (
    <div role="toolbar" aria-label="Panels" className="flex items-center gap-0.5">
      <CommandButton id="window.tree" />
      <CommandButton id="window.dock" />
      <CommandButton id="window.inspector" />
    </div>
  )
}
