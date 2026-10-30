// Sidebar widget: a quiet icon rail (docs/design/home-page(redesign).jpg). shadcn Sidebar
// with collapsible="icon", collapsed by default; Ctrl+B or the toggle at the bottom
// shows the labels. Only places to go live here (Home, Docs); projects live on Home,
// so you focus on one project at a time. Contents: features/sidebar/.
//
// Uses shadcn's own icon mode (collapsible="icon"): its sizes, its tooltips.
import { Sidebar, SidebarContent, SidebarFooter, SidebarTrigger } from "@blocksy/ui"
import { NavLinks } from "../../features/sidebar/nav-links"
import { SettingsButton } from "../../features/sidebar/settings-button"

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon" aria-label="Navigation" className="group-data-[side=left]:border-r-0">
      {/* Start below the titlebar row, like the reference. */}
      <SidebarContent className="pt-9">
        <NavLinks />
      </SidebarContent>
      <SidebarFooter>
        <SettingsButton />
        <SidebarTrigger className="text-fg-faint" />
      </SidebarFooter>
    </Sidebar>
  )
}
