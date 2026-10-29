// Home: recent projects and a way to start a new one.
import { Plus } from "lucide-react"
import { Button } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { prettyPath } from "../../shared/paths"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"
import { useSettings } from "../../shared/stores/settings"
import { useToasts } from "../../shared/stores/toasts"
import { Page } from "../page"

const ago = (time: number) => {
  const minutes = Math.round((Date.now() - time) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}

export function HomePage() {
  const projects = useRecent((s) => s.projects)
  const forget = useRecent((s) => s.forget)
  const home = useSettings((s) => s.home)
  const setNewProject = useNavigation((s) => s.setNewProject)

  const open = async (dir: string) => {
    try {
      await useProject.getState().open(dir)
    } catch (err) {
      useToasts.getState().show({
        message: `Couldn't open project: ${errorMessage(err)}`,
        tone: "error",
        action: { label: "Remove from list", run: () => void forget(dir) },
      })
    }
  }

  return (
    <Page
      title="Home"
      subtitle="Make Minecraft mods with visual editors, and learn Java along the way."
      actions={
        <Button variant="primary" className="h-7 rounded-md px-2.5" onClick={() => setNewProject(true)}>
          <Plus strokeWidth={2} /> New project
        </Button>
      }
    >
      <h2 className="mb-3 text-base text-fg-muted">Recent projects</h2>
      {projects.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-subtle px-5 py-6">
          <p className="text-base text-fg">No projects yet.</p>
          <p className="text-base text-fg-muted">Start with an empty mod: Blocksy sets up Gradle, the mod loader and the Java files for you.</p>
          <Button onClick={() => setNewProject(true)}>Create your first mod</Button>
        </div>
      ) : (
        <ul className="flex flex-col">
          {projects.map((project) => (
            <li key={project.dir}>
              <button
                type="button"
                onClick={() => void open(project.dir)}
                className="group flex h-14 w-full items-center gap-3 rounded-lg px-3 text-left outline-none transition-colors duration-150 hover:bg-surface/60 focus-visible:shadow-[0_0_0_3px_var(--b-focus)]"
              >
                <span className="size-3.5 shrink-0 rounded-xs bg-project" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base text-fg">{project.name}</span>
                  <span className="truncate text-sm text-fg-muted">{prettyPath(project.dir, home)}</span>
                </span>
                <span className="shrink-0 text-sm text-fg-muted">
                  Minecraft {project.minecraftVersion} · {ago(project.openedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
