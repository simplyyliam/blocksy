// The welcome window's left nav (JetBrains: Projects, Customize, Plugins, Learn): four views.
// Built on shadcn's Sidebar in its plain (non-collapsing) mode, 28px rows from the shell spec.
//
//   ▣ Projects
//   ◧ Learn
//   ☆ Community
//   ⚙ Settings
import { GraduationCap, Settings, Users, Folders, type LucideIcon } from "lucide-react"
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, Kbd } from "@blocksy/ui"
import { useWelcome, type WelcomeView } from "../../shared/stores/welcome"

const welcomeViews: { id: WelcomeView; label: string; Icon: LucideIcon }[] = [
  { id: "projects", label: "Projects", Icon: Folders },
  { id: "learn", label: "Learn", Icon: GraduationCap },
  { id: "community", label: "Community", Icon: Users },
  { id: "settings", label: "Settings", Icon: Settings },
]

export function WelcomeNav() {
  const view = useWelcome((s) => s.view)
  const creating = useWelcome((s) => s.creating)
  const setView = useWelcome((s) => s.setView)
  return (
    <SidebarProvider className="min-h-0 w-auto shrink-0" style={{ "--sidebar-width": "176px" } as React.CSSProperties}>
      <Sidebar collapsible="none" aria-label="Welcome" className="bg-transparent">
        <SidebarContent className="gap-0 px-2 pt-2">
          <SidebarMenu className="gap-0.5">
            {welcomeViews.map(({ id, label, Icon }, i) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={!creating && view === id}
                  onClick={() => setView(id)}
                  className="h-7 gap-2.5 data-active:bg-surface-hover"
                >
                  <Icon strokeWidth={1.75} />
                  <span className="flex-1">{label}</span>
                  <Kbd className="opacity-0 group-hover/menu-item:opacity-100">Ctrl+{i + 1}</Kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
