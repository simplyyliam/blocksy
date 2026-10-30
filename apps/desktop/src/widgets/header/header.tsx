// Header widget, which is also the window's titlebar: breadcrumb on the left, actions
// on the right, then minimise/maximise/close. Empty space drags the window and a
// double-click maximises it (data-tauri-drag-region). A hairline underneath meets the
// sidebar's border. Contents: features/header/.
// When the sidebar is hidden (Ctrl+B), its toggle shows here so it can come back.
import { SidebarTrigger, useSidebar } from "@blocksy/ui"
import { BuildActions } from "../../features/header/build-actions"
import { Breadcrumbs } from "../../features/header/breadcrumbs"
import { WindowControls } from "../../features/header/window-controls"

export function Header() {
  const { open } = useSidebar()
  return (
    <header data-tauri-drag-region className="flex h-11 shrink-0 items-center gap-4 border-b border-sidebar-border pl-2.5">
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center gap-1">
        {!open && <SidebarTrigger className="text-fg-muted" />}
        <Breadcrumbs />
      </div>
      <BuildActions />
      <WindowControls />
    </header>
  )
}
