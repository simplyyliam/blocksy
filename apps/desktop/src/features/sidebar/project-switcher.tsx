// The project switcher at the top of the sidebar: shows the open project (or
// "All projects" on Home) and opens a menu to jump to another one.
//
//   [■ Aetheric Storage…  ⌃⌄]
//    Projects
//    ■ Aetheric Storage Engineering
//    ■ Copper Golems
//    ─────────────
//    ☰ All projects
//    + New project
import { ChevronsUpDown, LayoutGrid, Plus } from "lucide-react"
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, toast,
} from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"

export function ProjectSwitcher() {
  const projects = useRecent((s) => s.projects)
  const current = useProject((s) => s.current)
  const page = useNavigation((s) => s.page)
  const go = useNavigation((s) => s.go)
  const setNewProject = useNavigation((s) => s.setNewProject)
  const showing = page === "project" ? current : null

  const open = async (dir: string) => {
    try {
      await useProject.getState().open(dir)
    } catch (err) {
      toast.error(`Couldn't open project: ${errorMessage(err)}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="min-w-0 max-w-full shrink justify-start gap-2 px-1.5 font-medium" />}
      >
        {showing ? (
          <span className="size-4 shrink-0 rounded-[4px] bg-project" />
        ) : (
          <span className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-fg text-bg">
            <LayoutGrid className="size-2.5!" strokeWidth={2.5} />
          </span>
        )}
        <span className="truncate">{showing ? showing.doc.name : "All projects"}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        {projects.length > 0 && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem key={project.dir} onClick={() => void open(project.dir)}>
                  <span className="size-4 shrink-0 rounded-[4px] bg-project" />
                  <span className="truncate">{project.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => go("home")}>
          <LayoutGrid strokeWidth={1.75} /> All projects
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setNewProject(true)}>
          <Plus strokeWidth={1.75} /> New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
