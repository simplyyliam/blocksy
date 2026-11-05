// The project layout: every project opens in this same frame, focused on that one
// project. No icon rail; a back button at the top left returns to Home.
//
//   ┌───────────────────────────────────────────────┐
//   │ File Edit Project Resources …           ─ ▢ ✕ │  menu bar (titlebar)
//   │ ← ▣ My mod │ ⊕ 💾 │ ↶ ↷ │ Build Run │ 🔍     │  toolbar
//   │ <Outlet />  (tree │ tabs + canvas │ inspector) │
//   │ Build log | Problems                           │  bottom dock
//   │ Status bar                                     │
//   └───────────────────────────────────────────────┘
import { useEffect } from "react"
import { Outlet, useParams } from "react-router-dom"
import { preloadBlockPreview } from "@blocksy/model-studio"
import { openProject } from "../../shared/open-project"
import { useProject } from "../../shared/stores/project"
import { NewElementDialog } from "../../features/project-editor/new-element-dialog"
import { BottomPanel } from "../../widgets/bottom-panel/bottom-panel"
import { Header } from "../../widgets/header/header"
import { StatusBar } from "../../widgets/status-bar/statusbar"
import { Toolbar } from "../../widgets/toolbar/toolbar"

export function ProjectLayout() {
  // The router already decodes params, so this is the folder path as written.
  const { projectId: dir = "" } = useParams()
  // Fetch the 3D preview code while the editor appears, so the first block opens fast.
  useEffect(preloadBlockPreview, [])

  // Arriving at a project URL opens that project (if it isn't the open one already).
  // Only when the URL changes: closing a project must not reopen it on the way out.
  useEffect(() => {
    if (dir && useProject.getState().current?.dir !== dir) void openProject(dir)
  }, [dir])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header />
      <Toolbar />
      <main className="page-enter min-h-0 flex-1 overflow-hidden px-2.5">
        <Outlet />
      </main>
      <BottomPanel />
      <StatusBar />
      <NewElementDialog />
    </div>
  )
}
