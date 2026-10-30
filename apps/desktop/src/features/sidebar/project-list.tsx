// "Projects": recently opened projects, each with its colour swatch (App.png).
import { Plus } from "lucide-react"
import {
  SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  ProjectCover, toast, Tooltip, TooltipContent, TooltipTrigger,
} from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"

export function ProjectList() {
  const projects = useRecent((s) => s.projects)
  const openDir = useProject((s) => s.current?.dir)
  const page = useNavigation((s) => s.page)
  const setNewProject = useNavigation((s) => s.setNewProject)

  const open = async (dir: string) => {
    try {
      await useProject.getState().open(dir)
    } catch (err) {
      toast.error(`Couldn't open project: ${errorMessage(err)}`)
    }
  }

  return (
    <SidebarGroup className="mt-[18px] min-h-0 p-0">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <Tooltip>
        <TooltipTrigger render={<SidebarGroupAction aria-label="New project" onClick={() => setNewProject(true)} />}>
          <Plus strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent>New project</TooltipContent>
      </Tooltip>

      <SidebarGroupContent className="mt-2 min-h-0 overflow-y-auto">
        {projects.length === 0 && <p className="px-2 text-base text-fg-faint">No projects yet</p>}
        <SidebarMenu>
          {projects.map((project) => {
            const active = page === "project" && project.dir === openDir
            return (
              <SidebarMenuItem key={project.dir}>
                <SidebarMenuButton
                  isActive={active}
                  className="h-7"
                  aria-current={active ? "page" : undefined}
                  title={project.dir}
                  onClick={() => void open(project.dir)}
                >
                  <ProjectCover seed={project.dir} grid={[4, 4]} className="size-3.5 shrink-0 overflow-hidden rounded-[4px]" />
                  <span>{project.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
