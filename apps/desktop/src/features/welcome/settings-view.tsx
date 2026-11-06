// Settings in the welcome window: the same panel as the editor's Settings dialog
// (theme, UI scale, Java, projects folder, updates).
import { useWelcome } from "../../shared/stores/welcome"
import { SettingsPanel } from "../settings/settings-panel"

export function SettingsView() {
  const section = useWelcome((s) => s.settingsSection)
  const setSection = useWelcome((s) => s.setSettingsSection)
  return (
    <SettingsPanel
      section={section}
      onSection={setSection}
      navWidth={168}
      title={<h1 className="mb-3 px-2.5 text-lg leading-normal text-fg">Settings</h1>}
    />
  )
}
