// The actions for the open project, defined once and shown in two places: the project name's
// dropdown and its right-click context menu. Same items in the same order, so both always match
// (context menus are a shortcut, never the only way to do something). The welcome window's list
// has its own menu (features/welcome/row-menu.tsx): pin, locate, remove from list.
//
//   Show in folder
//   Change cover…
//   Use generated cover   (only when a custom cover is set)
//   ─────────
//   Close project
import { FolderOpen, ImageIcon, Shapes, X } from "lucide-react"
import type { ReactElement } from "react"
import { revealItemInDir } from "@tauri-apps/plugin-opener"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, DropdownMenuItem,
  DropdownMenuSeparator, toast,
} from "@blocksy/ui"
import { errorMessage } from "./api"
import { changeCover, closeProject } from "./project-menu-actions"
import { useCovers } from "./stores/covers"

async function resetCover(dir: string) {
  try {
    await useCovers.getState().reset(dir)
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

/** The items. `kind` picks dropdown or context-menu parts; the actions are the same. */
export function ProjectMenuItems({ dir, kind }: { dir: string; kind: "dropdown" | "context" }) {
  const hasCustomCover = useCovers((s) => Boolean(s.byDir[dir]))
  const Item = kind === "dropdown" ? DropdownMenuItem : ContextMenuItem
  const Separator = kind === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator

  return (
    <>
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
      <Item onClick={() => void closeProject()}>
        <X strokeWidth={1.75} /> Close project
      </Item>
    </>
  )
}

/** Wraps one element so right-clicking it opens the project menu. */
export function ProjectContextMenu({ dir, children }: { dir: string; children: ReactElement }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="w-52">
        <ProjectMenuItems dir={dir} kind="context" />
      </ContextMenuContent>
    </ContextMenu>
  )
}
