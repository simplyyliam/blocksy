// The project layout: every project opens in this same frame, focused on that one
// project. No icon rail; a back button at the top left returns to Home.
//
//   ┌───────────────────────────────────────────────┐
//   │ ← ▣ My mod │ File Edit … │ ＋ 💾 ↶ ↷ Build Run │ 🔍 ─ ▢ ✕ │  titlebar: menus + quick actions
//   │ <Outlet />  (tree │ tabs + canvas │ inspector) │
//   │ Build log | Problems                           │  bottom dock
//   │ Status bar                                     │
//   └───────────────────────────────────────────────┘
import { useEffect } from "react"
import { Outlet, useParams } from "react-router-dom"
import { preloadBlockPreview } from "@blocksy/model-studio"
import { MinecraftProvider } from "@blocksy/ui"
import { openProject } from "../../shared/open-project"
import { buildMod } from "../../shared/project-actions"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"
import { useWorkspace } from "../../shared/vanilla/workspace"
import { NewElementDialog } from "../../features/project-editor/new-element-dialog"
import { ActivityBar } from "../../widgets/activity-bar/activity-bar"
import { BottomPanel } from "../../widgets/bottom-panel/bottom-panel"
import { Header } from "../../widgets/header/header"
import { StatusBar } from "../../widgets/status-bar/statusbar"

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

  // Minecraft's look (v0.4): find this project's files through the workspace index, and look
  // again after every successful Gradle run (which may just have downloaded Minecraft).
  const project = useProject((s) => s.current)
  const projectDir = project?.dir
  const minecraft = project?.version.minecraft
  const loader = project?.doc.target
  const lastResult = useGradle((s) => s.lastResult)
  const status = useWorkspace((s) => s.status)
  const assets = useWorkspace((s) => s.assets)
  useEffect(() => {
    if (projectDir && minecraft && loader) void useWorkspace.getState().refresh(projectDir, minecraft, loader)
  }, [projectDir, minecraft, loader])
  useEffect(() => {
    if (lastResult?.success && projectDir && minecraft && loader) void useWorkspace.getState().refresh(projectDir, minecraft, loader, true)
  }, [lastResult, projectDir, minecraft, loader])
  useEffect(() => () => useWorkspace.getState().reset(), [projectDir])

  return (
    <MinecraftProvider assets={assets} status={status} onBuild={() => void buildMod()}>
    <div className="flex h-full min-h-0 flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="page-enter min-h-0 flex-1 overflow-hidden pr-2.5">
            <Outlet />
          </main>
          <BottomPanel />
        </div>
      </div>
      <StatusBar />
      <NewElementDialog />
    </div>
    </MinecraftProvider>
  )
}
