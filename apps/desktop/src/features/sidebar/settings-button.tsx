// The settings gear at the bottom of the sidebar (where the GitHub account will sit later).
// Opens the Settings dialog.
import { Settings } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

export function SettingsButton() {
  const open = useNavigation((s) => s.settingsOpen)
  const setSettings = useNavigation((s) => s.setSettings)
  return (
    <SidebarMenu className="gap-0">
      <SidebarMenuItem>
        <SidebarMenuButton className="h-8" isActive={open} aria-haspopup="dialog" onClick={() => setSettings(true)}>
          <Settings strokeWidth={1.75} />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
