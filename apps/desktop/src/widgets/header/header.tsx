// Header widget, which is also the window's titlebar: a bare row with no border.
// Empty space drags the window, double-click maximises (data-tauri-drag-region).
//   Home:     (nothing)                                                  ─ ▢ ✕
//   Docs:     Docs / …  (breadcrumbs live only in Docs)                   ─ ▢ ✕
//   Project:  ▣ │ Berry Mod ▾ │ File Edit …     Build Run Export │ ◧ ▭ ◨ │ ─ ▢ ✕
// The window controls fill the full height and touch the top and right edges (native Windows).
// Heights and widths are the --b-titlebar-h / --b-activitybar-w tokens (docs/design/shell-spec.md).
// Contents: features/header/.
import { AppIcon } from "../../features/header/app-icon"
import { Breadcrumbs } from "../../features/header/breadcrumbs"
import { MenuBar } from "../../features/header/menu-bar"
import { PanelToggles } from "../../features/header/panel-toggles"
import { ProjectTitle } from "../../features/header/project-title"
import { RunActions } from "../../features/header/run-actions"
import { WindowControls } from "../../features/header/window-controls"
import { useNavigation } from "../../shared/stores/navigation"
import { Separator } from "@blocksy/ui"

export function Header() {
  const page = useNavigation((s) => s.page)
  const project = page === "project"
  return (
    <header data-tauri-drag-region className={`flex shrink-0 items-center ${project ? "h-(--b-titlebar-h) gap-1" : "h-11 gap-4 pl-4"}`}>
      {page === "docs" && <Breadcrumbs />}
      {project && (
        <>
          <AppIcon />
          <ProjectTitle />
          <MenuBar />
        </>
      )}
      {/* Empty space between the menus and the actions drags the window. */}
      <div data-tauri-drag-region className="h-full min-w-4 flex-1" />
      {project && (
        <>
          <RunActions />
          <Separator orientation="vertical" className="mx-1 h-4 bg-line" />
          <PanelToggles />
          <div className="w-1" />
        </>
      )}
      <WindowControls />
    </header>
  )
}
