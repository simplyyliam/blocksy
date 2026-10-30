// Home: recent projects and a way to start a new one.
import { Plus } from "lucide-react"
import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, toast } from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { prettyPath } from "../../shared/paths"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"
import { useSettings } from "../../shared/stores/settings"
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
      toast.error(`Couldn't open project: ${errorMessage(err)}`, {
        action: { label: "Remove from list", onClick: () => void forget(dir) },
      })
    }
  }

  return (
    <Page
      title="Home"
      subtitle="Make Minecraft mods with visual editors, and learn Java along the way."
      actions={
        <Button variant="default" size="sm" onClick={() => setNewProject(true)}>
          <Plus strokeWidth={2} /> New project
        </Button>
      }
    >
      <h2 className="mb-3 text-base text-fg-muted">Recent projects</h2>
      {projects.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-subtle px-5 py-6">
          <p className="text-base text-fg">No projects yet.</p>
          <p className="text-base text-fg-muted">Start with an empty mod: Blocksy sets up Gradle, the mod loader and the Java files for you.</p>
          <Button variant="secondary" size="sm" onClick={() => setNewProject(true)}>Create your first mod</Button>
        </div>
      ) : (
        <ItemGroup className="gap-0.5">
          {projects.map((project) => (
            <Item
              key={project.dir}
              size="sm"
              render={<button type="button" onClick={() => void open(project.dir)} />}
              className="w-full text-left hover:bg-surface/60"
            >
              <ItemMedia>
                <span className="size-4 shrink-0 rounded-xs bg-project" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="font-normal">{project.name}</ItemTitle>
                <ItemDescription className="truncate">{prettyPath(project.dir, home)}</ItemDescription>
              </ItemContent>
              <ItemActions className="text-xs text-fg-muted">
                Minecraft {project.minecraftVersion} · {ago(project.openedAt)}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </Page>
  )
}
