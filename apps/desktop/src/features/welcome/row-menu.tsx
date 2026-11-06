// The actions for one project in the list, defined once and shown in two places: the hover ⋯
// dropdown and the right-click context menu (and the Menu key opens the dropdown). Same items in
// the same order, so both always match: a context menu is a shortcut, never the only way.
//
//   Open
//   Pin to top / Unpin
//   Show in Explorer
//   Copy path
//   Change cover…  /  Use generated cover
//   ─────────
//   Remove from list
// A missing project gets Locate… first and loses Open, Pin and cover items.
import { Copy, FolderOpen, FolderSearch, ImageIcon, Pin, PinOff, Shapes, SquareArrowOutUpRight, Trash2 } from "lucide-react"
import type { ReactElement } from "react"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
  toast,
} from "@blocksy/ui"
import { errorMessage } from "../../shared/api"
import type { ProjectProblem } from "../../shared/project-check"
import { changeCover } from "../../shared/project-menu-actions"
import { useCovers } from "../../shared/stores/covers"
import type { RecentProject } from "../../shared/stores/recent"
import { copyPath, locateProject, openProjectAt, removeProject, showInExplorer, togglePin } from "./actions"

async function resetCover(dir: string) {
  try {
    await useCovers.getState().reset(dir)
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

export function RowMenuItems({ project, problem, kind }: { project: RecentProject; problem: ProjectProblem | null; kind: "dropdown" | "context" }) {
  const hasCustomCover = useCovers((s) => Boolean(s.byDir[project.dir]))
  const Item = kind === "dropdown" ? DropdownMenuItem : ContextMenuItem
  const Separator = kind === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator
  const missing = problem === "folder-missing" || problem === "file-missing"
  const openable = problem === null

  return (
    <>
      {missing && (
        <Item onClick={() => void locateProject(project)}>
          <FolderSearch strokeWidth={1.75} /> Locate…
        </Item>
      )}
      {openable && (
        <Item onClick={() => void openProjectAt(project.dir, project)}>
          <SquareArrowOutUpRight strokeWidth={1.75} /> Open
        </Item>
      )}
      {!missing && (
        <Item onClick={() => void togglePin(project)}>
          {project.pinned ? <PinOff strokeWidth={1.75} /> : <Pin strokeWidth={1.75} />} {project.pinned ? "Unpin" : "Pin to top"}
        </Item>
      )}
      {!missing && (
        <Item onClick={() => showInExplorer(project.dir)}>
          <FolderOpen strokeWidth={1.75} /> Show in Explorer
        </Item>
      )}
      <Item onClick={() => void copyPath(project.dir)}>
        <Copy strokeWidth={1.75} /> Copy path
      </Item>
      {!missing && (
        <Item onClick={() => void changeCover(project.dir)}>
          <ImageIcon strokeWidth={1.75} /> Change cover…
        </Item>
      )}
      {!missing && hasCustomCover && (
        <Item onClick={() => void resetCover(project.dir)}>
          <Shapes strokeWidth={1.75} /> Use generated cover
        </Item>
      )}
      <Separator />
      {/* Only forgets it in Blocksy; the files on disk stay untouched. */}
      <Item onClick={() => void removeProject(project)}>
        <Trash2 strokeWidth={1.75} /> Remove from list
      </Item>
    </>
  )
}

/** Wraps one row so right-clicking it opens the same menu as the ⋯ button. */
export function RowContextMenu({ project, problem, children }: { project: RecentProject; problem: ProjectProblem | null; children: ReactElement }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="w-52">
        <RowMenuItems project={project} problem={problem} kind="context" />
      </ContextMenuContent>
    </ContextMenu>
  )
}
