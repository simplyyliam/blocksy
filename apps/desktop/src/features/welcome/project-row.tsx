// One project in the welcome list (JetBrains-style, 44px): cover icon, name over path, loader and
// Minecraft version, last opened, a pin mark and the ⋯ menu.
//
//   [img] Berry Mod                      Fabric · 26.1.2     2 h ago   📌 ⋯
//         ~/Blocksy/berry_mod
//   [ ! ] Old Test       Folder missing                     [Locate…] [Remove]
//         D:/mods/old_test
// It is an `option` of the list's listbox: the list owns the keyboard (use-list-keys, projects-view).
import { MoreHorizontal, Pin, TriangleAlert } from "lucide-react"
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@blocksy/ui"
import { registries } from "../../app/modules"
import { prettyPath } from "../../shared/paths"
import { problemText, type ProjectProblem } from "../../shared/project-check"
import { ProjectImage } from "../../shared/project-image"
import type { RecentProject } from "../../shared/stores/recent"
import { locateProject, openProjectAt, removeProject } from "./actions"
import { ago } from "./filter"
import { RowContextMenu, RowMenuItems } from "./row-menu"

interface Props {
  project: RecentProject
  home: string | null
  problem: ProjectProblem | null
  selected: boolean
  id: string
  onSelect(): void
}

export function ProjectRow({ project, home, problem, selected, id, onSelect }: Props) {
  const missing = problem === "folder-missing" || problem === "file-missing"
  const loader = registries.loaderTargets.get(project.target)?.name ?? project.target
  return (
    <RowContextMenu project={project} problem={problem}>
      <div
        id={id}
        role="option"
        aria-selected={selected}
        data-selected={selected || undefined}
        onMouseMove={onSelect}
        onClick={() => (missing ? undefined : void openProjectAt(project.dir, project))}
        className={cn(
          "group flex h-11 items-center gap-3 rounded-md px-2 outline-none",
          missing ? "cursor-default" : "cursor-pointer",
          selected ? "bg-surface-hover" : "hover:bg-surface-hover/60",
        )}
      >
        <span className={cn("relative size-7 shrink-0", missing && "opacity-40 grayscale")}>
          <ProjectImage dir={project.dir} className="size-7 rounded-md" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm", missing ? "text-fg-muted" : "text-fg")} title={project.name}>
            {project.name}
          </p>
          <p className="truncate text-xs text-fg-muted" title={project.dir}>
            {prettyPath(project.dir, home)}
          </p>
        </div>

        {problem === null && (
          <>
            <span className="w-[104px] shrink-0 truncate text-xs text-fg-muted">
              {loader} · {project.minecraftVersion}
            </span>
            <span className="w-[76px] shrink-0 truncate text-right text-xs text-fg-muted">{ago(project.openedAt)}</span>
          </>
        )}
        {problem === "unsupported" && (
          <span className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-warning">
            <TriangleAlert className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate" title={problemText(problem, project)}>Minecraft {project.minecraftVersion} isn't supported</span>
          </span>
        )}
        {missing && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-warning">
            <TriangleAlert className="size-3.5 shrink-0" strokeWidth={1.75} /> {problemText(problem, project)}
          </span>
        )}

        {missing && (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); void locateProject(project) }}>
              Locate…
            </Button>
            <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); void removeProject(project) }}>
              Remove
            </Button>
          </div>
        )}
        {!missing && (
          <div className="flex w-12 shrink-0 items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            {project.pinned && <Pin className="size-3 text-fg-muted group-hover:hidden group-data-[selected]:hidden" strokeWidth={2} aria-label="Pinned" />}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    data-row-menu
                    aria-label={`Actions for ${project.name}`}
                    className="shrink-0 text-fg-muted opacity-0 group-hover:opacity-100 group-data-[selected]:opacity-100 data-[popup-open]:opacity-100"
                  />
                }
              >
                <MoreHorizontal strokeWidth={1.75} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <RowMenuItems project={project} problem={problem} kind="dropdown" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </RowContextMenu>
  )
}
