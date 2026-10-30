// The actions for a project, defined once and shown in two places: the ··· dropdown and
// the right-click context menu. Same items in the same order, so both always match
// (context menus are a shortcut, never the only way to do something).
//
//   Open                  (where you are not already in the project)
//   Show in folder
//   Change cover…
//   Use generated cover   (only when a custom cover is set)
//   ─────────
//   Remove from list  /  Close project
import { FolderOpen, ImageIcon, Shapes, SquareArrowOutUpRight, Trash2, X } from "lucide-react"
import type { ReactElement } from "react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, DropdownMenuItem,
  DropdownMenuSeparator, toast,
} from "@blocksy/ui"
import { errorMessage } from "./api"
import { openProject } from "./open-project"
import { useCovers } from "./stores/covers"
import { useNavigation } from "./stores/navigation"
import { useProject } from "./stores/project"
import { useRecent } from "./stores/recent"

export interface ProjectMenuOptions {
  /** Show "Open" (off when you are already inside the project). */
  open?: boolean
  /** The last, separated item: forget it from the recent list, or close it. */
  end?: "remove" | "close"
}

async function changeCover(dir: string) {
  try {
    if (await useCovers.getState().choose(dir)) toast("Cover updated")
  } catch (err) {
    toast.error(`Couldn't use that picture: ${errorMessage(err)}`)
  }
}

async function resetCover(dir: string) {
  try {
    await useCovers.getState().reset(dir)
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

function closeProject() {
  useProject.getState().close()
  useNavigation.getState().go("home")
}

/** The items. `kind` picks dropdown or context-menu parts; the actions are the same. */
export function ProjectMenuItems({ dir, kind, open = true, end = "remove" }: { dir: string; kind: "dropdown" | "context" } & ProjectMenuOptions) {
  const hasCustomCover = useCovers((s) => Boolean(s.byDir[dir]))
  const Item = kind === "dropdown" ? DropdownMenuItem : ContextMenuItem
  const Separator = kind === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator

  return (
    <>
      {open && (
        <Item onClick={() => void openProject(dir)}>
          <SquareArrowOutUpRight strokeWidth={1.75} /> Open
        </Item>
      )}
      <Item onClick={() => void revealItemInDir(dir)}>
        <FolderOpen strokeWidth={1.75} /> Show in folder
      </Item>
      <Item onClick={() => void changeCover(dir)}>
        <ImageIcon strokeWidth={1.75} /> Change cover…
      </Item>
      {hasCustomCover && (
        <Item onClick={() => void resetCover(dir)}>
          <Shapes strokeWidth={1.75} /> Use generated cover
        </Item>
      )}
      <Separator />
      {end === "remove" ? (
        // Only forgets it in Blocksy; the files on disk stay untouched.
        <Item onClick={() => void useRecent.getState().forget(dir)}>
          <Trash2 strokeWidth={1.75} /> Remove from list
        </Item>
      ) : (
        <Item onClick={closeProject}>
          <X strokeWidth={1.75} /> Close project
        </Item>
      )}
    </>
  )
}

/** Wraps one element (a card, a row) so right-clicking it opens the project menu. */
export function ProjectContextMenu({ dir, children, ...options }: { dir: string; children: ReactElement } & ProjectMenuOptions) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="w-52">
        <ProjectMenuItems dir={dir} kind="context" {...options} />
      </ContextMenuContent>
    </ContextMenu>
  )
}
