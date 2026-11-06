// Status bar widget (26px, --b-statusbar-h): a frame that shows whichever view fits what's
// happening now (idle, building, game running, ...), then the always-present items.
//   left:  [build state] [problems]            right: [update] [look] [autosave] [loader]
// Status only: items report live state and may open a popover or a panel in the current view,
// never a new route. The views live in features/status-bar/. Switching views crossfades.
import { AnimatePresence, motion } from "motion/react"
import { statusLeading, statusTrailing, statusViews } from "../../features/status-bar/views"
import type { StatusSnapshot } from "../../features/status-bar/types"
import { useGradle } from "../../shared/stores/gradle"
import { useProject } from "../../shared/stores/project"

function useSnapshot(): StatusSnapshot {
  const task = useGradle((s) => s.task)
  const lastResult = useGradle((s) => s.lastResult)
  const hasProject = useProject((s) => s.current !== null)
  return { task, lastResult, hasProject }
}

export function StatusBar() {
  const snapshot = useSnapshot()
  const active = statusViews
    .filter((view) => view.when(snapshot))
    .sort((a, b) => b.priority - a.priority)[0]!

  // A thin, plain bar (VS Code / macOS menu bar style): text and icons, no pills.
  return (
    <footer className="flex h-(--b-statusbar-h) min-w-0 shrink-0 items-center justify-between gap-4 px-1" aria-label="Status">
      <div className="flex min-w-0 items-center gap-0.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active.id}
            className="flex min-w-0 items-center gap-0.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <active.View />
          </motion.div>
        </AnimatePresence>
        {statusLeading.map((Item, i) => (
          <Item key={i} />
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {statusTrailing.map((Item, i) => (
          <Item key={i} />
        ))}
      </div>
    </footer>
  )
}
