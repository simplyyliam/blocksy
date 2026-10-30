// The open project's name in the titlebar row, with its picture and a ··· menu
// (Show in folder, Change cover…, Close project). Right-click does the same.
import { MoreHorizontal } from "lucide-react"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@blocksy/ui"
import { ProjectImage } from "../../shared/project-image"
import { ProjectContextMenu, ProjectMenuItems } from "../../shared/project-menu"
import { useProject } from "../../shared/stores/project"

export function ProjectTitle() {
  const project = useProject((s) => s.current)
  if (!project) return null
  return (
    <div className="flex min-w-0 items-center gap-1">
      <ProjectContextMenu dir={project.dir} open={false} end="close">
        <div className="flex min-w-0 items-center gap-2 px-1">
          <ProjectImage dir={project.dir} grid={[4, 4]} className="size-4 shrink-0 overflow-hidden rounded-[4px]" />
          <span className="truncate text-sm text-fg">{project.doc.name}</span>
        </div>
      </ProjectContextMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Project actions" className="text-fg-muted" />}>
          <MoreHorizontal strokeWidth={1.75} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <ProjectMenuItems dir={project.dir} kind="dropdown" open={false} end="close" />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
