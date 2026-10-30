// Home and Docs: the places in the icon rail. Each shows its name in a tooltip while
// the rail is collapsed. New sections of Blocksy (learning, tools) go in this list.
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
    <SidebarGroup>
      <SidebarMenu className="gap-1">
        {links.map(({ page: target, label, Icon }) => (
          <SidebarMenuItem key={target}>
            <SidebarMenuButton
              isActive={page === target}
              tooltip={label}
              className={activeRow}
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
