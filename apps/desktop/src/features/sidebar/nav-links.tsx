// Home and Docs at the top of the sidebar.
import { BookOpen, House } from "lucide-react"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@blocksy/ui"
import { useNavigation, type Page } from "../../shared/stores/navigation"
import { ActiveHighlight, activeRow } from "./active-highlight"

const links: { page: Page; label: string; Icon: typeof House }[] = [
  { page: "home", label: "Home", Icon: House },
  { page: "docs", label: "Docs", Icon: BookOpen },
]

export function NavLinks() {
  const page = useNavigation((s) => s.page)
  const go = useNavigation((s) => s.go)
  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-0">
        {links.map(({ page: target, label, Icon }) => (
          <SidebarMenuItem key={target}>
            <SidebarMenuButton
              isActive={page === target}
              className={`h-7 ${activeRow}`}
              aria-current={page === target ? "page" : undefined}
              onClick={() => go(target)}
            >
              {page === target && <ActiveHighlight />}
              <Icon strokeWidth={1.75} />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
