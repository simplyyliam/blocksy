// The app shell (App.png): the shadcn sidebar on the left (Settings at its foot);
// header, page, bottom panel and status bar on the right.
//
//   ┌──────────┬──────────────────────────────────────┐
//   │ Sidebar  │ Header                               │
//   │          │ Page                                 │
//   │          │ Bottom panel (Build log)             │
//   │ Settings │ Status bar                           │
//   └──────────┴──────────────────────────────────────┘
import { SidebarProvider, Toaster, TooltipProvider } from "@blocksy/ui"
import { NewProjectDialog } from "../features/new-project/new-project-dialog"
import { SettingsDialog } from "../features/settings/settings-dialog"
import { DocsPage } from "../pages/docs/docs-page"
import { HomePage } from "../pages/home/home-page"
import { JdkPage } from "../pages/jdk/jdk-page"
import { ProjectPage } from "../pages/project/project-page"
import { useNavigation, type Page } from "../shared/stores/navigation"
import { BottomPanel } from "../widgets/bottom-panel/bottom-panel"
import { Header } from "../widgets/header/header"
import { AppSidebar } from "../widgets/sidebar/sidebar"
import { StatusBar } from "../widgets/status-bar/statusbar"

const pages: Record<Page, () => React.ReactNode> = {
  home: HomePage,
  project: ProjectPage,
  docs: DocsPage,
  jdk: JdkPage,
}

export function App() {
  const page = useNavigation((s) => s.page)
  const Current = pages[page]

  return (
    <TooltipProvider delay={500}>
      <SidebarProvider className="h-full min-h-0">
        <AppSidebar />
        {/* A plain column next to the sidebar (no SidebarInset: the sidebar is not inset). */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6 pl-[23px]">
          <Header />
          {/* key={page} replays the fade-in each time the page changes */}
          <main key={page} className="page-enter min-h-0 flex-1 overflow-y-auto">
            <Current />
          </main>
          <BottomPanel />
          <div className="mt-4">
            <StatusBar />
          </div>
        </div>
      </SidebarProvider>
      <NewProjectDialog />
      <SettingsDialog />
      {/* Toasts sit bottom-right, just above the status bar. */}
      <Toaster position="bottom-right" offset={{ right: 20, bottom: 56 }} />
    </TooltipProvider>
  )
}
