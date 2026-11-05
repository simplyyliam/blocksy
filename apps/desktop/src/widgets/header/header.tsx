// Header widget, which is also the window's titlebar: a bare row with no border.
// Empty space drags the window, double-click maximises (data-tauri-drag-region).
//   Home:     (nothing)                                              ─ ▢ ✕
//   Docs:     Docs / …  (breadcrumbs live only in Docs)               ─ ▢ ✕
//   Project:  ← ▣ Berry Mod │ File Edit … │ ＋ 💾 ↶ ↷ │ Build Run Export    🔍  ─ ▢ ✕
// In a project the menus and the quick actions share this one row (no separate toolbar).
// Contents: features/header/.
import { Breadcrumbs } from "../../features/header/breadcrumbs"
import { MenuBar } from "../../features/header/menu-bar"
import { ProjectTitle } from "../../features/header/project-title"
import { PixelBackButton, TitleActions, TitleSearch } from "../../features/header/title-actions"
import { WindowControls } from "../../features/header/window-controls"
import { useNavigation } from "../../shared/stores/navigation"

export function Header() {
  const page = useNavigation((s) => s.page)
  return (
    <header data-tauri-drag-region className={`flex shrink-0 items-center gap-1 ${page === "project" ? "h-10 pl-1.5" : "h-11 gap-4 pl-4"}`}>
      {page === "docs" && <Breadcrumbs />}
      {page === "project" && (
        <>
          <PixelBackButton />
          <ProjectTitle />
          <MenuBar />
          <TitleActions />
        </>
      )}
      {/* Empty space between the actions and the search drags the window. */}
      <div data-tauri-drag-region className="h-full min-w-4 flex-1" />
      {page === "project" && <TitleSearch />}
      <WindowControls />
    </header>
  )
}
