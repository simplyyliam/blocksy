// Header widget: a slim bar with the breadcrumb on the left and actions on the right,
// a hairline underneath that meets the sidebar's border. Contents: features/header/.
// When the sidebar is hidden (Ctrl+B), its toggle shows here so it can come back.
import { SidebarTrigger, useSidebar } from "@blocksy/ui"
import { BuildActions } from "../../features/header/build-actions"
import { Breadcrumbs } from "../../features/header/breadcrumbs"

export function Header() {
  const { open } = useSidebar()
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border px-2.5">
      <div className="flex min-w-0 items-center gap-1">
        {!open && <SidebarTrigger className="text-fg-muted" />}
        <Breadcrumbs />
      </div>
      <BuildActions />
    </header>
  )
}
