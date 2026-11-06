// The open project's name in the titlebar, with its picture and a ▾ menu
// (Show in folder, Change cover…, Close project). The whole name is the trigger, like
// JetBrains' project switcher. Right-click does the same.
import { ChevronDown } from "lucide-react"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@blocksy/ui"
import { ProjectImage } from "../../shared/project-image"
import { ProjectContextMenu, ProjectMenuItems } from "../../shared/project-menu"
import { useProject } from "../../shared/stores/project"

export function ProjectTitle() {
  const project = useProject((s) => s.current)
  if (!project) return null
  return (
    <ProjectContextMenu dir={project.dir}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" aria-label="Project actions" className="h-6 min-w-0 gap-1.5 rounded-sm px-2 font-normal text-fg hover:bg-surface-hover" />}
        >
          <ProjectImage dir={project.dir} grid={[4, 4]} className="size-4 shrink-0 overflow-hidden rounded-[4px]" />
          <span className="max-w-40 truncate">{project.doc.name}</span>
          <ChevronDown className="size-3.5 shrink-0 text-fg-faint" strokeWidth={1.75} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <ProjectMenuItems dir={project.dir} kind="dropdown" />
        </DropdownMenuContent>
      </DropdownMenu>
    </ProjectContextMenu>
  )
}
