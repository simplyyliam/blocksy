// Sidebar widget: the shadcn Sidebar (variant "sidebar", not "inset") that frames the
// app rail. Its contents live in features/sidebar/. Ctrl+B hides and shows it.
import { Sidebar, SidebarContent, SidebarFooter } from "@blocksy/ui"
import { NavLinks } from "../../features/sidebar/nav-links"
import { ProjectList } from "../../features/sidebar/project-list"
import { SettingsButton } from "../../features/sidebar/settings-button"

export function AppSidebar() {
  // No right border: App.png keeps the rail and the page on one calm surface.
  return (
    <Sidebar variant="sidebar" aria-label="Navigation" className="group-data-[side=left]:border-r-0">
      <SidebarContent className="pt-3">
        <NavLinks />
        <ProjectList />
      </SidebarContent>
      <SidebarFooter>
        <SettingsButton />
      </SidebarFooter>
    </Sidebar>
  )
}
