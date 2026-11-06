// Settings in the welcome window: one flat page with the same sections as the editor's Settings
// dialog (theme, UI scale, Java, projects folder, updates), no sidebar of its own.
import { SettingsPage } from "../settings/settings-panel"
import { useWelcome } from "../../shared/stores/welcome"

export function SettingsView() {
  const section = useWelcome((s) => s.settingsSection)
  return <SettingsPage scrollTo={section} />
}
