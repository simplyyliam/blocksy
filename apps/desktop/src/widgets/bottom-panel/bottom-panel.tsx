// Bottom dock widget: slides open under the editor; drag its top edge to resize.
// Two tabs: Build log and Problems. Their content lives in features/bottom-panel/.
// Height and open state are remembered per project (shared/layout-memory.ts).
import { X } from "lucide-react"
import { useRef } from "react"
import { Button, cn } from "@blocksy/ui"
import { BuildLog } from "../../features/bottom-panel/build-log"
import { Problems } from "../../features/bottom-panel/problems"
import { History } from "../../features/project-editor/history"
import { useProblems } from "../../features/bottom-panel/use-problems"
import { useEditor, type DockTab } from "../../shared/stores/editor"
import { useNavigation } from "../../shared/stores/navigation"

const MIN_HEIGHT = 120

export function BottomPanel() {
  const open = useNavigation((s) => s.bottomPanelOpen)
  const setOpen = useNavigation((s) => s.setBottomPanel)
  const height = useEditor((s) => s.dockHeight)
  const setLayout = useEditor((s) => s.setLayout)
  const tab = useEditor((s) => s.dockTab)
  const setTab = useEditor((s) => s.setDockTab)
  const problems = useProblems().length
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startHeight: height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const max = window.innerHeight * 0.7
    setLayout({ dockHeight: Math.round(Math.min(max, Math.max(MIN_HEIGHT, drag.current.startHeight + drag.current.startY - e.clientY))) })
  }

  const tabs: { id: DockTab; label: string; count?: number }[] = [
    { id: "log", label: "Build log" },
    { id: "problems", label: "Problems", count: problems },
    { id: "history", label: "History" },
  ]

  return (
    // Animating grid rows 0fr <-> 1fr gives a smooth open/close without measuring.
    <div
      className={cn(
        "grid shrink-0 px-2.5 transition-[grid-template-rows,opacity,margin] duration-250 ease-out",
        open ? "mt-2 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <section
          style={{ height }}
          className="relative flex flex-col overflow-hidden rounded-lg bg-bg shadow-[inset_0_0_0_1px_var(--b-line-subtle)]"
          aria-label="Bottom dock"
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            className="absolute inset-x-0 top-0 h-1.5 cursor-row-resize"
            aria-hidden
          />
          <div className="flex h-8 shrink-0 items-center justify-between pr-1.5 pl-1.5">
            <div role="tablist" aria-label="Dock" className="flex items-center gap-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex h-6 items-center gap-1.5 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    tab === t.id ? "bg-surface text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className="rounded-full bg-warning/15 px-1.5 text-xs text-warning tabular-nums">{t.count}</span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Close dock" onClick={() => setOpen(false)}>
              <X strokeWidth={1.75} />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col border-t border-line-subtle">{tab === "log" ? <BuildLog /> : tab === "problems" ? <Problems /> : <div className="min-h-0 flex-1 overflow-y-auto"><History /></div>}</div>
        </section>
      </div>
    </div>
  )
}
