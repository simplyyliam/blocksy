// Header widget, which is also the window's titlebar: a bare row with no border.
// Empty space drags the window, double-click maximises (data-tauri-drag-region).
//   Home:     (nothing)                                   ─ ▢ ✕
//   Docs:     Docs / …  (breadcrumbs live only in Docs)    ─ ▢ ✕
//   Project:  ← ▣ My mod ···          Build Run Export     ─ ▢ ✕   (← back to Home)
// Contents: features/header/.
import { BackButton } from "../../features/header/back-button"
import { BuildActions } from "../../features/header/build-actions"
import { Breadcrumbs } from "../../features/header/breadcrumbs"
import { ProjectTitle } from "../../features/header/project-title"
import { WindowControls } from "../../features/header/window-controls"
import { useNavigation } from "../../shared/stores/navigation"

export function Header() {
  const page = useNavigation((s) => s.page)
  return (
    <header data-tauri-drag-region className={`flex h-11 shrink-0 items-center gap-4 ${page === "project" ? "pl-2" : "pl-4"}`}>
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center gap-1">
        {page === "docs" && <Breadcrumbs />}
        {page === "project" && (
          <>
            <BackButton />
            <ProjectTitle />
          </>
        )}
      </div>
      <BuildActions />
      <WindowControls />
    </header>
  )
}
