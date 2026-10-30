// The settings gear at the bottom of the sidebar (where the GitHub account will sit later).
import { Settings } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@blocksy/ui"
import { useNavigation } from "../../shared/stores/navigation"

export function SettingsButton() {
  const active = useNavigation((s) => s.page === "settings")
  const go = useNavigation((s) => s.go)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={active} aria-current={active ? "page" : undefined} onClick={() => go("settings")}>
          <Settings strokeWidth={1.75} />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
