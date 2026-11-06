// Settings in the welcome window: the same panel as the editor's Settings dialog
// (theme, UI scale, Java, projects folder, updates).
import { useState } from "react"
import { SettingsPanel } from "../settings/settings-panel"
import type { SettingsSectionId } from "../settings/settings-sections"

export function SettingsView() {
  const [section, setSection] = useState<SettingsSectionId>("general")
  return (
    <SettingsPanel
      section={section}
      onSection={setSection}
      navWidth={168}
      title={<h1 className="mb-3 px-2.5 text-lg leading-normal text-fg">Settings</h1>}
    />
  )
}
