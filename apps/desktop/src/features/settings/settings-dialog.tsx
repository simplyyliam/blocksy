// The editor's Settings dialog (Ctrl+,): a Dialog around the shared SettingsPanel
// (features/settings/settings-panel.tsx), which the welcome window shows too.
import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"
import { SettingsPanel } from "./settings-panel"
import { settingsSections, type SettingsSectionId } from "./settings-sections"

export function SettingsDialog() {
  const open = useNavigation((s) => s.settingsOpen)
  const setOpen = useNavigation((s) => s.setSettings)
  const [section, setSection] = useState<SettingsSectionId>("general")
  // Opened with a section (the Java setup command): jump to it while the dialog opens.
  const wanted = useNavigation((s) => s.settingsSection)
  const [seen, setSeen] = useState<string | null>(null)
  if (!open && seen !== null) setSeen(null) // closed: forget, so the same section can be asked for again
  if (open && wanted !== seen) {
    setSeen(wanted)
    const target = settingsSections.find((s) => s.id === wanted)
    if (target) setSection(target.id)
  }
  // Focus the content pane on open, so no focus ring flashes on the first nav row.
  const paneRef = useRef<HTMLElement>(null)

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogContent initialFocus={paneRef} className="h-[520px] max-h-[calc(100vh-48px)] w-[760px] max-w-[calc(100vw-48px)] gap-0 overflow-hidden rounded-dialog p-0 sm:max-w-[calc(100vw-48px)]">
        <SettingsPanel
          section={section}
          onSection={setSection}
          paneRef={paneRef}
          title={<DialogTitle className="mb-3 px-2.5 text-lg leading-normal text-fg">Settings</DialogTitle>}
        />
      </DialogContent>
    </Dialog>
  )
}
