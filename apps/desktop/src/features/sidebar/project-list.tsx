// "Projects": recently opened projects, each with its colour swatch (App.png).
import { Plus } from "lucide-react"
import { motion } from "motion/react"
import { Tooltip } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"
import { useToasts } from "../../shared/stores/toasts"

export function ProjectList() {
  const projects = useRecent((s) => s.projects)
  const openDir = useProject((s) => s.current?.dir)
  const page = useNavigation((s) => s.page)
  const setNewProject = useNavigation((s) => s.setNewProject)

  const open = async (dir: string) => {
    try {
      await useProject.getState().open(dir)
    } catch (err) {
      useToasts.getState().show({ message: `Couldn't open project: ${errorMessage(err)}`, tone: "error" })
    }
  }

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex h-7 items-center justify-between pr-1 pl-2">
        <span className="text-base text-fg-muted">Projects</span>
        <Tooltip label="New project">
          <button
            type="button"
            aria-label="New project"
            onClick={() => setNewProject(true)}
            className="grid size-6 place-items-center rounded-md text-fg-muted outline-none transition-colors hover:bg-surface hover:text-fg focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <div className="mt-1.5 flex min-h-0 flex-col gap-0.5 overflow-y-auto">
        {projects.length === 0 && <p className="px-2 text-base text-fg-faint">No projects yet</p>}
        {projects.map((project) => {
          const active = page === "project" && project.dir === openDir
          return (
            <button
              key={project.dir}
              type="button"
              title={project.dir}
              onClick={() => void open(project.dir)}
              aria-current={active ? "page" : undefined}
              className="relative flex h-7 shrink-0 items-center gap-2 rounded-md px-2 text-left text-base text-fg outline-none transition-colors duration-150 hover:bg-surface/60 focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-highlight"
                  className="absolute inset-0 rounded-md bg-surface"
                  transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <span className="relative size-3.5 shrink-0 rounded-xs bg-project" />
              <span className="relative truncate">{project.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
