// The Projects view: search, the three big actions, and the recent projects (pinned first).
//
//   [🔍 Search projects      Ctrl+F]   [+ New project] [Open folder] [Clone]  [⋯]
//   Pinned
//   [img] Berry Mod                         Fabric · 26.1.2      2 h ago   📌 ⋯
//   Recent
//   [img] Copper Golems                     Fabric · 26.3      yesterday      ⋯
//
// Keyboard: the list is one `listbox` (arrows, Home/End, Enter, Delete, Ctrl+Shift+P, Menu key);
// typing a letter or Ctrl+F goes to the search box; Esc clears it. Every row action is in actions.ts.
import { FolderOpen, GitBranch, MoreHorizontal, Plus, Search, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AnimatedNumber, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, InputGroup, InputGroupAddon,
  InputGroupButton, InputGroupInput, Kbd,
} from "@blocksy/ui"
import { checkProject, type ProjectProblem } from "../../shared/project-check"
import { useRecent } from "../../shared/stores/recent"
import { useSettings } from "../../shared/stores/settings"
import { useWelcome } from "../../shared/stores/welcome"
import { locateProject, openFolder, openProjectAt, removeMissing, removeProject, togglePin } from "./actions"
import { DropOverlay } from "./drop-overlay"
import { EmptyState } from "./empty-state"
import { displayOrder, filterProjects, groupProjects, moveSelection } from "./filter"
import { ProjectRow } from "./project-row"
import { CloneDialog } from "./clone-dialog"

const SEARCH_ID = "welcome-search"
const rowId = (dir: string) => `project-${encodeURIComponent(dir)}`

/** What is wrong with each listed project, looked up on the disk now and whenever the window gets focus back. */
function useProblems(): Record<string, ProjectProblem | null> {
  const projects = useRecent((s) => s.projects)
  const [problems, setProblems] = useState<Record<string, ProjectProblem | null>>({})
  const latest = useRef(0)
  const refresh = useCallback(() => {
    const mine = ++latest.current // a slower, older check must not overwrite a newer one
    void Promise.all(projects.map(async (p) => [p.dir, await checkProject(p).catch(() => null)] as const)).then(
      (pairs) => mine === latest.current && setProblems(Object.fromEntries(pairs)),
    )
  }, [projects])
  useEffect(refresh, [refresh])
  useEffect(() => {
    // Someone may have moved a folder in Explorer while Blocksy sat in the background.
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [refresh])
  return problems
}

export function ProjectsView() {
  const projects = useRecent((s) => s.projects)
  const home = useSettings((s) => s.home)
  const setCreating = useWelcome((s) => s.setCreating)
  const setCloning = useWelcome((s) => s.setCloning)
  const pendingOpen = useWelcome((s) => s.pendingOpen)
  const problems = useProblems()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // File > Open... in the editor brings us here asking for the folder picker, once.
  useEffect(() => {
    if (!pendingOpen) return
    useWelcome.getState().clearPendingOpen()
    void openFolder()
  }, [pendingOpen])

  const shown = useMemo(() => filterProjects(projects, query), [projects, query])
  const { pinned, recent } = groupProjects(shown)
  const order = useMemo(() => displayOrder(shown), [shown])
  const missing = projects.filter((p) => problems[p.dir] === "folder-missing" || problems[p.dir] === "file-missing")
  // The selection follows the list: if its project is gone (removed, filtered out), fall back to the first row.
  const selectedProject = order.find((p) => p.dir === selected) ?? order[0] ?? null
  const index = selectedProject ? order.indexOf(selectedProject) : -1

  // Keep the keyboard-selected row in view.
  useEffect(() => {
    if (selectedProject) document.getElementById(rowId(selectedProject.dir))?.scrollIntoView({ block: "nearest" })
  }, [selectedProject])

  const focusSearch = () => document.getElementById(SEARCH_ID)?.focus()

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End") {
      e.preventDefault()
      const next = order[moveSelection(order.length, index, e.key)]
      if (next) setSelected(next.dir)
    } else if (e.key === "Enter" && selectedProject) {
      e.preventDefault()
      const problem = problems[selectedProject.dir]
      if (problem === "folder-missing" || problem === "file-missing") void locateProject(selectedProject)
      else void openProjectAt(selectedProject.dir, selectedProject)
    } else if (e.key === "Delete" && selectedProject) {
      e.preventDefault()
      // Move the selection to the neighbour first, so the keyboard stays where it was.
      const neighbour = order[index + 1] ?? order[index - 1]
      setSelected(neighbour?.dir ?? null)
      void removeProject(selectedProject)
    } else if (e.key.toLowerCase() === "p" && (e.ctrlKey || e.metaKey) && e.shiftKey && selectedProject) {
      e.preventDefault()
      void togglePin(selectedProject)
    } else if ((e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) && selectedProject) {
      e.preventDefault()
      document.getElementById(rowId(selectedProject.dir))?.querySelector<HTMLElement>("[data-row-menu]")?.click()
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      focusSearch() // typing starts a search, like JetBrains (the key lands in the box)
    }
  }

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && query) {
      e.preventDefault()
      e.stopPropagation()
      setQuery("")
    } else if (e.key === "ArrowDown" && order.length > 0) {
      e.preventDefault()
      listRef.current?.focus()
    } else if (e.key === "Enter" && order.length > 0) {
      e.preventDefault()
      const first = order[0]!
      void openProjectAt(first.dir, first)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="relative h-full">
        <EmptyState />
        <DropOverlay />
        <CloneDialog />
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col px-3 pt-1">
      <div className="flex items-center gap-2 pb-2">
        <InputGroup className="h-8 min-w-0 flex-1">
          <InputGroupAddon>
            <Search strokeWidth={1.75} />
          </InputGroupAddon>
          <InputGroupInput
            id={SEARCH_ID}
            type="search"
            spellCheck={false}
            autoComplete="off"
            placeholder="Search projects"
            aria-label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
          />
          <InputGroupAddon align="inline-end">
            {query ? (
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery("")}>
                <X strokeWidth={1.75} />
              </InputGroupButton>
            ) : (
              <Kbd>Ctrl+F</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus strokeWidth={2} /> New project
        </Button>
        <Button size="sm" variant="outline" onClick={() => void openFolder()}>
          <FolderOpen strokeWidth={1.75} /> Open
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCloning(true)}>
          <GitBranch strokeWidth={1.75} /> Clone
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label="More" className="text-fg-muted" />}>
            <MoreHorizontal strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem disabled={missing.length === 0} onClick={() => void removeMissing(missing)}>
              Remove missing projects ({missing.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-10 text-center">
          <p className="text-base text-fg">No projects match “{query}”</p>
          <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={0}
          aria-label="Projects"
          aria-activedescendant={selectedProject ? rowId(selectedProject.dir) : undefined}
          onKeyDown={onListKey}
          className="min-h-0 flex-1 overflow-y-auto rounded-md pb-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {[
            { label: "Pinned", items: pinned },
            { label: "Recent", items: recent },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.label} role="group" aria-label={group.label} className="mb-2">
                <h2 className="px-2 pt-2 pb-1 text-xs text-fg-muted">
                  {group.label} <AnimatedNumber value={group.items.length} />
                </h2>
                {group.items.map((project) => (
                  <ProjectRow
                    key={project.dir}
                    id={rowId(project.dir)}
                    project={project}
                    home={home}
                    problem={problems[project.dir] ?? null}
                    selected={project.dir === selectedProject?.dir}
                    onSelect={() => setSelected(project.dir)}
                  />
                ))}
              </div>
            ))}
        </div>
      )}
      <DropOverlay />
      <CloneDialog />
    </div>
  )
}
