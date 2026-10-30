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
      <SidebarContent className="gap-0 pt-6 pr-3.5 pl-6">
        <NavLinks />
        <ProjectList />
      </SidebarContent>
      <SidebarFooter className="pt-0 pr-3.5 pb-6 pl-6">
        <SettingsButton />
      </SidebarFooter>
    </Sidebar>
  )
}
