// Where you are, as a quiet breadcrumb (top left of the header):
//   ⬚ Projects / ■ Aetheric Storage Engineering ···
// On other pages it is just the page name ("⌂ Home"). The ··· menu holds project actions.
import { BookOpen, Box, Coffee, FolderOpen, House, MoreHorizontal, X, type LucideIcon } from "lucide-react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@blocksy/ui"
import { useNavigation, type Page } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"

const roots: Record<Page, { label: string; Icon: LucideIcon }> = {
  home: { label: "Home", Icon: House },
  docs: { label: "Docs", Icon: BookOpen },
  jdk: { label: "Java setup", Icon: Coffee },
  project: { label: "Projects", Icon: Box },
}

function ProjectMenu({ dir }: { dir: string }) {
  const close = useProject((s) => s.close)
  const go = useNavigation((s) => s.go)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Project actions" className="text-fg-muted" />}>
        <MoreHorizontal strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => void revealItemInDir(dir)}>
          <FolderOpen strokeWidth={1.75} /> Show in folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            close()
            go("home")
          }}
        >
          <X strokeWidth={1.75} /> Close project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Breadcrumbs() {
  const page = useNavigation((s) => s.page)
  const go = useNavigation((s) => s.go)
  const project = useProject((s) => s.current)
  const { label, Icon } = roots[page]
  const inProject = page === "project" && project

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-2.5 text-base">
        <BreadcrumbItem className="gap-2.5">
          <Icon className="size-4 shrink-0 text-fg-muted" strokeWidth={1.5} />
          {inProject ? (
            <BreadcrumbLink render={<button type="button" onClick={() => go("home")} />} className="text-fg-muted">
              {label}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {inProject && (
          <>
            <BreadcrumbSeparator className="text-fg-faint">/</BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0 gap-2.5">
              <span className="size-4 shrink-0 rounded-xs bg-project" />
              <BreadcrumbPage className="truncate">{project.doc.name}</BreadcrumbPage>
              <ProjectMenu dir={project.dir} />
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
