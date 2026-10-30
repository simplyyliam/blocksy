// The app shell (docs/design/home-page(redesign).jpg): calm and borderless. An icon rail
// on the left; the titlebar row, the page and (inside a project only) the build log and
// status bar on the right. Home and Docs show nothing but their content.
//
//   ┌────┬──────────────────────────────────────┐
//   │    │ titlebar row                  ─ ▢ ✕  │
//   │ ⌂  │                                      │
//   │ ▢  │ Page                                 │
//   │    │ Build log    ← project page only     │
//   │ ⚙  │ Status bar   ← project page only     │
//   └────┴──────────────────────────────────────┘
import { LayoutGroup, MotionConfig } from "motion/react"
import { SidebarProvider, Toaster, TooltipProvider } from "@blocksy/ui"
import { NewProjectDialog } from "../features/new-project/new-project-dialog"
import { SettingsDialog } from "../features/settings/settings-dialog"
import { WhatsNewDialog } from "../features/whats-new/whats-new-dialog"
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
  // Build log and status bar belong to working on a project, not to Home or Docs.
  const inProject = page === "project"

  return (
    // reducedMotion="user": every motion animation follows the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={500}>
        {/* shadcn Sidebar, collapsed to its icon mode by default; Ctrl+B shows the labels. */}
        <SidebarProvider
          defaultOpen={false}
          className="h-full min-h-0"
          style={{ "--sidebar-width": "220px" } as React.CSSProperties}
        >
          {/* One LayoutGroup so the sidebar highlight can glide between its sections. */}
          <LayoutGroup id="sidebar">
            <AppSidebar />
          </LayoutGroup>
          {/* A plain column next to the sidebar (no SidebarInset: the sidebar is not inset). */}
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Header />
            {/* key={page} replays the fade-in each time the page changes */}
            <main key={page} className="page-enter min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5">
              <Current />
            </main>
            {inProject && (
              <>
                <div className="px-2.5">
                  <BottomPanel />
                </div>
                <StatusBar />
              </>
            )}
          </div>
        </SidebarProvider>
        <NewProjectDialog />
        <SettingsDialog />
        <WhatsNewDialog />
        <Toaster position="bottom-right" offset={{ right: 20, bottom: 36 }} />
      </TooltipProvider>
    </MotionConfig>
  )
}
