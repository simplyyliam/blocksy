// Sidebar widget: the frame for the app rail. Its contents live in features/sidebar/.
import { LayoutGroup } from "motion/react"
import { NavLinks } from "../../features/sidebar/nav-links"
import { ProjectList } from "../../features/sidebar/project-list"
import { SettingsButton } from "../../features/sidebar/settings-button"

export function Sidebar() {
  return (
    // One LayoutGroup so the grey highlight can slide from Home to a project and back.
    <LayoutGroup id="sidebar">
      <aside className="flex min-h-0 flex-col gap-6" aria-label="Navigation">
        <NavLinks />
        <ProjectList />
      </aside>
    </LayoutGroup>
  )
}

/** Bottom-left corner, on the same line as the status bar. */
export function SidebarFooter() {
  return (
    <div className="flex items-center">
      <SettingsButton />
    </div>
  )
}
