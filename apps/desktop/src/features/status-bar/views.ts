// Every status bar view and right-side item. Add a new one with one line here.
import { BuildLogToggle } from "./build-log-toggle"
import { buildingView } from "./building-view"
import { failedView } from "./failed-view"
import { gameView } from "./game-view"
import { idleView } from "./idle-view"
import type { StatusView } from "./types"
import { UpdateNote } from "./update-note"

/** Left side: the widget shows the highest-priority view whose `when` is true. */
export const statusViews: StatusView[] = [gameView, buildingView, failedView, idleView]

/** Right side: always-present items, in order. */
export const statusTrailing = [UpdateNote, BuildLogToggle]
