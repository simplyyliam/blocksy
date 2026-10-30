// Bottom panel widget: slides open under the page; drag its top edge to resize.
// Its content (the Build log) lives in features/bottom-panel/.
import { X } from "lucide-react"
import { useRef, useState } from "react"
import { Button, cn } from "@blocksy/ui"
import { BuildLog } from "../../features/bottom-panel/build-log"
import { useNavigation } from "../../shared/stores/navigation"

const MIN_HEIGHT = 140

export function BottomPanel() {
  const open = useNavigation((s) => s.bottomPanelOpen)
  const setOpen = useNavigation((s) => s.setBottomPanel)
  const [height, setHeight] = useState(260)
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startHeight: height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const max = window.innerHeight * 0.7
    setHeight(Math.min(max, Math.max(MIN_HEIGHT, drag.current.startHeight + drag.current.startY - e.clientY)))
  }

  return (
    // Animating grid rows 0fr <-> 1fr gives a smooth open/close without measuring.
    <div
      className={cn(
        "grid shrink-0 transition-[grid-template-rows,opacity,margin] duration-250 ease-out",
        open ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <section
          style={{ height }}
          className="relative flex flex-col overflow-hidden rounded-lg bg-bg shadow-[inset_0_0_0_1px_var(--b-line-subtle)]"
          aria-label="Build log"
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            className="absolute inset-x-0 top-0 h-1.5 cursor-row-resize"
            aria-hidden
          />
          <div className="flex h-10 shrink-0 items-center justify-between pr-2 pl-4">
            <span className="text-base text-fg">Build log</span>
            <Button variant="ghost" size="icon-sm" aria-label="Close build log" onClick={() => setOpen(false)}>
              <X strokeWidth={1.75} />
            </Button>
          </div>
          <div className="min-h-0 flex-1 border-t border-line-subtle">
            <BuildLog />
          </div>
        </section>
      </div>
    </div>
  )
}
