// The app shell (App.png): sidebar on the left; header, page and bottom panel on the
// right; the settings gear and the status bar share the bottom line.
//
//   ┌──────────┬──────────────────────────────────────┐
//   │ Sidebar  │ Header                               │
//   │          │ Page                                 │
//   │          │ Bottom panel (Build log)             │
//   ├──────────┼──────────────────────────────────────┤
//   │ Settings │ Status bar                           │
//   └──────────┴──────────────────────────────────────┘
import { TooltipProvider } from "@blocksy/ui"
import { NewProjectDialog } from "../features/new-project/new-project-dialog"
import { DocsPage } from "../pages/docs/docs-page"
import { HomePage } from "../pages/home/home-page"
import { JdkPage } from "../pages/jdk/jdk-page"
import { ProjectPage } from "../pages/project/project-page"
import { SettingsPage } from "../pages/settings/settings-page"
import { useNavigation, type Page } from "../shared/stores/navigation"
import { BottomPanel } from "../widgets/bottom-panel/bottom-panel"
import { Header } from "../widgets/header/header"
import { Sidebar, SidebarFooter } from "../widgets/sidebar/sidebar"
import { StatusBar } from "../widgets/status-bar/statusbar"
import { Toaster } from "./toaster"

const pages: Record<Page, () => React.ReactNode> = {
  home: HomePage,
  project: ProjectPage,
  docs: DocsPage,
  settings: SettingsPage,
  jdk: JdkPage,
}

export function App() {
  const page = useNavigation((s) => s.page)
  const Current = pages[page]

  return (
    <TooltipProvider delay={500}>
      <div className="grid h-full grid-cols-[192px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-[30px] gap-y-4 p-5">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-col">
          <Header />
          {/* key={page} replays the fade-in each time the page changes */}
          <main key={page} className="page-enter min-h-0 flex-1 overflow-y-auto">
            <Current />
          </main>
          <BottomPanel />
        </div>
        <SidebarFooter />
        <StatusBar />
      </div>
      <NewProjectDialog />
      <Toaster />
    </TooltipProvider>
  )
}
