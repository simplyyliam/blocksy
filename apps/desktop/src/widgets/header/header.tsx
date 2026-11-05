// Header widget, which is also the window's titlebar: a bare row with no border.
// Empty space drags the window, double-click maximises (data-tauri-drag-region).
//   Home:     (nothing)                                              ─ ▢ ✕
//   Docs:     Docs / …  (breadcrumbs live only in Docs)               ─ ▢ ✕
//   Project:  File Edit Project Resources Build & run Tools …         ─ ▢ ✕
// In a project the quick actions (back, title, Build, Run) sit in the toolbar row below
// (widgets/toolbar). Contents: features/header/.
import { Breadcrumbs } from "../../features/header/breadcrumbs"
import { MenuBar } from "../../features/header/menu-bar"
import { WindowControls } from "../../features/header/window-controls"
import { useNavigation } from "../../shared/stores/navigation"

export function Header() {
  const page = useNavigation((s) => s.page)
  return (
    <header data-tauri-drag-region className={`flex h-9 shrink-0 items-center gap-4 ${page === "project" ? "pl-2" : "pl-4"}`}>
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center gap-1">
        {page === "docs" && <Breadcrumbs />}
        {page === "project" && <MenuBar />}
      </div>
      <WindowControls />
    </header>
  )
}
