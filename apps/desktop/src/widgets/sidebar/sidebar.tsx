// Sidebar widget: the shadcn Sidebar (variant "sidebar", not "inset") that frames the
// app rail. Its contents live in features/sidebar/. Ctrl+B or the toggle hides it.
//
//   [■ My Mod ⌃⌄]    [⊟]   ← project switcher; same height as the header, so their lines meet
//   ⌂ Home
//   ...
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger } from "@blocksy/ui"
import { NavLinks } from "../../features/sidebar/nav-links"
import { ProjectSwitcher } from "../../features/sidebar/project-switcher"
import { ProjectList } from "../../features/sidebar/project-list"
import { SettingsButton } from "../../features/sidebar/settings-button"

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" aria-label="Navigation">
      <SidebarHeader data-tauri-drag-region className="h-11 flex-row items-center justify-between gap-2 px-2.5 py-0">
        <div className="flex min-w-0 flex-1">
          <ProjectSwitcher />
        </div>
        <SidebarTrigger className="text-fg-muted" />
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2.5 pt-1.5">
        <NavLinks />
        <ProjectList />
      </SidebarContent>
      <SidebarFooter className="p-2.5 pt-0">
        <SettingsButton />
      </SidebarFooter>
    </Sidebar>
  )
}
