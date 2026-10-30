// The project layout: every project opens in this same frame, focused on that one
// project. No icon rail; a back button at the top left returns to Home.
//
//   ┌───────────────────────────────────────────────┐
//   │ ← ▣ My mod ···          Build Run Export ─ ▢ ✕ │
//   │ <Outlet />  (the project editor)               │
//   │ Build log                                      │
//   │ Status bar                                     │
//   └───────────────────────────────────────────────┘
import { useEffect } from "react"
import { Outlet, useParams } from "react-router-dom"
import { openProject } from "../../shared/open-project"
import { useProject } from "../../shared/stores/project"
import { BottomPanel } from "../../widgets/bottom-panel/bottom-panel"
import { Header } from "../../widgets/header/header"
import { StatusBar } from "../../widgets/status-bar/statusbar"

export function ProjectLayout() {
  const { projectId = "" } = useParams()
  const dir = decodeURIComponent(projectId)
  // Arriving at a project URL opens that project (if it isn't the open one already).
  // Only when the URL changes: closing a project must not reopen it on the way out.
  useEffect(() => {
    if (dir && useProject.getState().current?.dir !== dir) void openProject(dir)
  }, [dir])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header />
      <main className="page-enter min-h-0 flex-1 overflow-hidden px-2.5">
        <Outlet />
      </main>
      <div className="px-2.5">
        <BottomPanel />
      </div>
      <StatusBar />
    </div>
  )
}
