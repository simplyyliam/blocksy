// Every status bar view and item. Add a new one with one line here.
// The bar only shows status: an item may open a popover or a panel in the current view,
// never a new route (CLAUDE.md).
import { AutosaveItem } from "./autosave-item"
import { buildingView } from "./building-view"
import { failedView } from "./failed-view"
import { gameView } from "./game-view"
import { idleView } from "./idle-view"
import { LoaderItem } from "./loader-item"
import { LookItem } from "./look-item"
import { ProblemsItem } from "./problems-item"
import type { StatusView } from "./types"
import { UpdateNote } from "./update-note"

/** Left side: the widget shows the highest-priority view whose `when` is true. */
export const statusViews: StatusView[] = [gameView, buildingView, failedView, idleView]

/** Left side, after the view: always-present items, in order. */
export const statusLeading = [ProblemsItem]

/** Right side: always-present items, in order. */
export const statusTrailing = [UpdateNote, LookItem, AutosaveItem, LoaderItem]
