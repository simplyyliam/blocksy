// Status bar widget: a frame that shows whichever view fits what's happening now
// (idle, building, game running, ...). The views live in features/status-bar/.
// Switching views crossfades, so the bar never jumps.
import { AnimatePresence, motion } from "motion/react"
import { statusTrailing, statusViews } from "../../features/status-bar/views"
import type { StatusSnapshot } from "../../features/status-bar/types"
import { useGradle } from "../../shared/stores/gradle"
import { useJava } from "../../shared/stores/java"
import { useProject } from "../../shared/stores/project"

function useSnapshot(): StatusSnapshot {
  const task = useGradle((s) => s.task)
  const lastResult = useGradle((s) => s.lastResult)
  const hasProject = useProject((s) => s.current !== null)
  const javaStatus = useJava((s) => s.status)
  return { task, lastResult, hasProject, javaStatus }
}

export function StatusBar() {
  const snapshot = useSnapshot()
  const active = statusViews
    .filter((view) => view.when(snapshot))
    .sort((a, b) => b.priority - a.priority)[0]!

  // A thin, plain bar (VS Code / macOS menu bar style): text and icons, no pills.
  return (
    <footer className="flex h-[26px] min-w-0 shrink-0 items-center justify-between gap-4 px-2" aria-label="Status">
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
      <div className="flex shrink-0 items-center gap-0.5">
        {statusTrailing.map((Item, i) => (
          <Item key={i} />
        ))}
      </div>
    </footer>
  )
}
