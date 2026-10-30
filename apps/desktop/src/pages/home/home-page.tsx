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
import { LayoutGrid, List, MoreHorizontal, Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import {
  AnimatedNumber, Button, Card, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Item, ItemActions, ItemContent, ItemDescription,
  ItemGroup, ItemMedia, ItemTitle, ToggleGroup, ToggleGroupItem,
} from "@blocksy/ui"
import { openProject } from "../../shared/open-project"
import { ProjectContextMenu, ProjectMenuItems } from "../../shared/project-menu"
import { ProjectImage } from "../../shared/project-image"
import { prettyPath } from "../../shared/paths"
import { useJava } from "../../shared/stores/java"
import { useNavigation } from "../../shared/stores/navigation"
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

/** Cards and rows rise in one after another; a removed one fades and shrinks away. */
const appear = (index: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const, delay: Math.min(index, 8) * 0.035 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16 } },
})

/** "Thursday 30th October, 2026", like the reference. */
const today = () => {
  const d = new Date()
  const n = d.getDate()
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"
  return `${d.toLocaleDateString("en-GB", { weekday: "long" })} ${n}${suffix} ${d.toLocaleDateString("en-GB", { month: "long" })}, ${d.getFullYear()}`
}

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening."
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
      <DropdownMenuContent align="end" className="w-52">
        <ProjectMenuItems dir={project.dir} kind="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProjectCard({ project }: { project: RecentProject }) {
  return (
    <ProjectContextMenu dir={project.dir}>
      {/* Lifts a little on hover and presses down on click; the cover zooms a touch. */}
      {/* No border (calm, like the reference): the cover lifts and zooms a touch on hover. */}
      <Card className="group gap-0 rounded-none bg-transparent py-0 shadow-none ring-0">
        <button
          type="button"
          onClick={() => void openProject(project.dir)}
          className="block overflow-hidden rounded-xl outline-none transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-0 active:scale-[0.99]"
          aria-label={`Open ${project.name}`}
        >
          <ProjectImage dir={project.dir} className="aspect-[16/10] w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
        </button>
        <div className="flex items-start gap-2 px-0.5 pt-2.5">
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
    </ProjectContextMenu>
  )
}

function ProjectRow({ project, home }: { project: RecentProject; home: string | null }) {
  return (
    <ProjectContextMenu dir={project.dir}>
      <Item size="xs" className="hover:bg-surface/60">
        <ItemMedia>
          <ProjectImage dir={project.dir} className="h-6 w-9 rounded-[3px]" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <button type="button" onClick={() => void openProject(project.dir)} className="text-left outline-none">
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
    </ProjectContextMenu>
  )
}

export function HomePage() {
  const projects = useRecent((s) => s.projects)
  const { home, homeView, update } = useSettings()
  const setNewProject = useNavigation((s) => s.setNewProject)
  const go = useNavigation((s) => s.go)
  const javaMissing = useJava((s) => s.status === "missing")
  const javaRequired = useJava((s) => s.required)
  const last = projects[0]

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-14 pb-16">
      <p className="text-sm text-fg-muted">{today()}</p>
      <h1 className="mt-1.5 text-2xl font-medium tracking-[-0.015em] text-fg">{greeting()}</h1>
      <p className="mt-4 max-w-[60ch] text-md leading-relaxed text-fg">
        {last ? (
          <>
            You have{" "}
            <span className="text-fg">
              <AnimatedNumber value={projects.length} /> {projects.length === 1 ? "project" : "projects"}
            </span>
            . Last opened{" "}
            <span className="text-fg">{last.name}</span>, {ago(last.openedAt)}.
          </>
        ) : (
          "Make Minecraft mods with visual editors, and learn Java along the way."
        )}
      </p>
      {/* The one thing Home needs to say about Java: only when it is missing. */}
      {javaMissing && (
        <p className="mt-3 text-sm text-fg-muted">
          Blocksy needs Java {javaRequired} to build mods.{" "}
          <button type="button" onClick={() => go("jdk")} className="text-brand underline-offset-4 outline-none hover:underline focus-visible:underline">
            Set up Java
          </button>
        </p>
      )}

      <div className="mt-12 mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm text-fg">
          Projects <AnimatedNumber value={projects.length} className="text-fg-muted" />
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-6">
          <AnimatePresence initial={true} mode="popLayout">
            {projects.map((project, i) => (
              <motion.div key={project.dir} layout {...appear(i)}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <ItemGroup className="gap-0.5">
          <AnimatePresence initial={true} mode="popLayout">
            {projects.map((project, i) => (
              <motion.div key={project.dir} layout {...appear(i)}>
                <ProjectRow project={project} home={home} />
              </motion.div>
            ))}
          </AnimatePresence>
        </ItemGroup>
      )}
    </div>
  )
}
