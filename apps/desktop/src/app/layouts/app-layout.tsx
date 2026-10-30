import { LayoutGroup } from "motion/react"
import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider } from "@blocksy/ui"
import { Header } from "../../widgets/header/header"
import { AppSidebar } from "../../widgets/sidebar/sidebar"

export function AppLayout() {
  // The first path segment ("", "docs", "jdk"): the fade-in replays when it changes.
  const section = useLocation().pathname.split("/")[1]
  return (
    // shadcn Sidebar, collapsed to its icon mode by default; Ctrl+B shows the labels.
    <SidebarProvider defaultOpen={false} className="h-full min-h-0" style={{ "--sidebar-width": "220px" } as React.CSSProperties}>
      {/* One LayoutGroup so the sidebar highlight can glide between its sections. */}
      <LayoutGroup id="sidebar">
        <AppSidebar />
      </LayoutGroup>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <main key={section} className="page-enter min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
