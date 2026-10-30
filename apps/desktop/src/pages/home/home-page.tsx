// Home: a greeting, then your projects as a grid of cards (cover, name, actions) or a
// compact list. The grid/list choice is remembered in Settings.
//
//   Good morning.
//   You have 2 projects. Last opened Copper Golems, 1 h ago.
//   Projects 2                              [▦|☰] [+ New project]
//   ┌────────┐ ┌────────┐
//   │ cover  │ │ cover  │
//   │ Name ··│ │ Name ··│
//   └────────┘ └────────┘
import { FolderOpen, LayoutGrid, List, MoreHorizontal, Plus, SquareArrowOutUpRight, Trash2 } from "lucide-react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import {
  Button, Card, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Item,
  ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, ProjectCover, toast, ToggleGroup, ToggleGroupItem,
} from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import { prettyPath } from "../../shared/paths"
import { useNavigation } from "../../shared/stores/navigation"
import { useProject } from "../../shared/stores/project"
import { useRecent, type RecentProject } from "../../shared/stores/recent"
import { useSettings } from "../../shared/stores/settings"

const ago = (time: number) => {
  const minutes = Math.round((Date.now() - time) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening."
}

async function openProject(project: RecentProject) {
  try {
    await useProject.getState().open(project.dir)
  } catch (err) {
    toast.error(`Couldn't open project: ${errorMessage(err)}`, {
      action: { label: "Remove from list", onClick: () => void useRecent.getState().forget(project.dir) },
    })
  }
}

/** The ··· menu on a card or row. */
function ProjectMenu({ project }: { project: RecentProject }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${project.name}`} className="shrink-0 text-fg-muted" />}
      >
        <MoreHorizontal strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => void openProject(project)}>
          <SquareArrowOutUpRight strokeWidth={1.75} /> Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void revealItemInDir(project.dir)}>
          <FolderOpen strokeWidth={1.75} /> Show in folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Only forgets it here; the files on disk stay untouched. */}
        <DropdownMenuItem onClick={() => void useRecent.getState().forget(project.dir)}>
          <Trash2 strokeWidth={1.75} /> Remove from list
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProjectCard({ project }: { project: RecentProject }) {
  return (
    <Card className="group gap-0 rounded-lg py-0 shadow-none transition-shadow duration-150 hover:ring-foreground/15">
      <button type="button" onClick={() => void openProject(project)} className="block outline-none" aria-label={`Open ${project.name}`}>
        <ProjectCover seed={project.dir} className="aspect-[16/10] w-full transition-[filter] duration-200 group-hover:brightness-[1.04]" />
      </button>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg" title={project.name}>
            {project.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-fg-muted">
            Minecraft {project.minecraftVersion} · {ago(project.openedAt)}
          </p>
        </div>
        <ProjectMenu project={project} />
      </div>
    </Card>
  )
}

function ProjectRow({ project, home }: { project: RecentProject; home: string | null }) {
  return (
    <Item size="xs" className="hover:bg-surface/60">
      <ItemMedia>
        <ProjectCover seed={project.dir} className="h-6 w-9 rounded-[3px]" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <button type="button" onClick={() => void openProject(project)} className="text-left outline-none">
          <ItemTitle className="w-full truncate font-normal">{project.name}</ItemTitle>
        </button>
        <ItemDescription className="truncate text-xs">{prettyPath(project.dir, home)}</ItemDescription>
      </ItemContent>
      <ItemActions className="gap-3 text-xs text-fg-muted">
        <span className="hidden whitespace-nowrap sm:inline">
          Minecraft {project.minecraftVersion} · {ago(project.openedAt)}
        </span>
        <ProjectMenu project={project} />
      </ItemActions>
    </Item>
  )
}

export function HomePage() {
  const projects = useRecent((s) => s.projects)
  const { home, homeView, update } = useSettings()
  const setNewProject = useNavigation((s) => s.setNewProject)
  const last = projects[0]

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-10 pb-16">
      <h1 className="text-xl font-medium tracking-[-0.01em] text-fg">{greeting()}</h1>
      <p className="mt-1.5 text-base text-fg-muted">
        {last ? (
          <>
            You have <span className="text-fg">{projects.length === 1 ? "1 project" : `${projects.length} projects`}</span>. Last opened{" "}
            <span className="text-fg">{last.name}</span>, {ago(last.openedAt)}.
          </>
        ) : (
          "Make Minecraft mods with visual editors, and learn Java along the way."
        )}
      </p>

      <div className="mt-8 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm text-fg">
          Projects <span className="text-fg-muted">{projects.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <ToggleGroup
              aria-label="Show projects as"
              variant="outline"
              spacing={0}
              value={[homeView]}
              onValueChange={(next) => next[0] && void update({ homeView: next[0] as "grid" | "list" })}
            >
              <ToggleGroupItem value="grid" aria-label="Grid" className="h-7 min-w-7 px-0">
                <LayoutGrid strokeWidth={1.75} />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List" className="h-7 min-w-7 px-0">
                <List strokeWidth={1.75} />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          <Button variant="outline" size="sm" className="h-7 px-2.5" onClick={() => setNewProject(true)}>
            <Plus strokeWidth={2} /> New project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-subtle px-5 py-6">
          <p className="text-base text-fg">No projects yet.</p>
          <p className="text-base text-fg-muted">Start with an empty mod: Blocksy sets up Gradle, the mod loader and the Java files for you.</p>
          <Button variant="default" size="sm" onClick={() => setNewProject(true)}>
            Create your first mod
          </Button>
        </div>
      ) : homeView === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.dir} project={project} />
          ))}
        </div>
      ) : (
        <ItemGroup className="gap-0.5">
          {projects.map((project) => (
            <ProjectRow key={project.dir} project={project} home={home} />
          ))}
        </ItemGroup>
      )}
    </div>
  )
}
