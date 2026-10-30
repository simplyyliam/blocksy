// Where you are, as a slim breadcrumb (top left of the header). The current page is a
// small grey chip; parents are plain muted text:
//   [Home]                      on Home
//   Projects / [■ My Mod] ···   inside a project (··· holds project actions)
import { FolderOpen, MoreHorizontal, X } from "lucide-react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@blocksy/ui"
import { CoverMenuItems } from "../../shared/cover-menu-items"
import { ProjectImage } from "../../shared/project-image"
import { useNavigation, type Page } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"

const titles: Record<Page, string> = { home: "Home", docs: "Docs", jdk: "Java setup", project: "Projects" }

/** The grey chip around the current page's name. */
const chip = "flex h-6 items-center gap-1.5 rounded-md bg-muted px-2 text-sm text-fg"

function ProjectMenu({ dir }: { dir: string }) {
  const close = useProject((s) => s.close)
  const go = useNavigation((s) => s.go)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Project actions" className="text-fg-muted" />}>
        <MoreHorizontal strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => void revealItemInDir(dir)}>
          <FolderOpen strokeWidth={1.75} /> Show in folder
        </DropdownMenuItem>
        <CoverMenuItems dir={dir} />
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
  const inProject = page === "project" && project

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1.5 text-sm">
        {inProject ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<button type="button" onClick={() => go("home")} />} className="px-1 text-fg-muted">
                {titles.project}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-fg-faint">/</BreadcrumbSeparator>
            <BreadcrumbItem className="min-w-0 gap-1">
              <BreadcrumbPage className={chip}>
                <ProjectImage dir={project.dir} grid={[4, 4]} className="size-3.5 shrink-0 overflow-hidden rounded-[4px]" />
                <span className="truncate">{project.doc.name}</span>
              </BreadcrumbPage>
              <ProjectMenu dir={project.dir} />
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className={chip}>{titles[page]}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
