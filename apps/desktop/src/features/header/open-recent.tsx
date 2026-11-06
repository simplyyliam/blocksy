// File > Open Recent: the other recent projects, switching the editor to the one you pick
// (ADR 0020: Open Recent stays in the editor; the full list with search and pins is the welcome window).
import { History } from "lucide-react"
import { MenubarItem, MenubarSeparator, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@blocksy/ui"
import { openProject } from "../../shared/open-project"
import { prettyPath } from "../../shared/paths"
import { closeProject } from "../../shared/project-menu-actions"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"
import { useRecent } from "../../shared/stores/recent"
import { useSettings } from "../../shared/stores/settings"

const SHOWN = 10

export function OpenRecent() {
  const projects = useRecent((s) => s.projects)
  const home = useSettings((s) => s.home)
  const current = useProject((s) => s.current?.dir)
  const others = projects.filter((p) => p.dir !== current).slice(0, SHOWN)

  // A running build or game belongs to the project being left.
  const open = async (dir: string) => {
    try {
      if (useGradle.getState().task !== null) await useGradle.getState().stop()
    } catch {
      return // couldn't stop it: stay in this project
    }
    await openProject(dir)
  }

  return (
    <MenubarSub>
      <MenubarSubTrigger className="gap-2 rounded-lg px-2 py-1.5 font-normal">
        <History strokeWidth={1.75} />
        Open Recent
      </MenubarSubTrigger>
      <MenubarSubContent className="min-w-64 rounded-xl p-1">
        {others.length === 0 && (
          <MenubarItem disabled className="rounded-lg px-2 py-1.5 font-normal">
            No other recent projects
          </MenubarItem>
        )}
        {others.map((p) => (
          <MenubarItem key={p.dir} onClick={() => void open(p.dir)} className="flex-col items-start gap-0 rounded-lg px-2 py-1.5 font-normal">
            <span className="text-sm text-fg">{p.name}</span>
            <span className="text-xs text-fg-muted">{prettyPath(p.dir, home)}</span>
          </MenubarItem>
        ))}
        <MenubarSeparator />
        <MenubarItem onClick={() => void closeProject()} className="rounded-lg px-2 py-1.5 font-normal">
          All projects…
        </MenubarItem>
      </MenubarSubContent>
    </MenubarSub>
  )
}
