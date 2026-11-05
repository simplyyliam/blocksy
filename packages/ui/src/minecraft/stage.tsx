// <McStage>: the canvas an editor shows a Minecraft screen on: the dotted backdrop, the screen
// centered, and a small floating view card with the game's "GUI scale" (1 to 4). The scale is
// remembered while the app runs, so every editor opens at the size you last chose.
//
//   <McStage hint="How the tab looks in the creative inventory.">{(scale) => <McScreen scale={scale} … />}</McStage>
import { useState, type ReactNode } from "react"
import { cn } from "../lib/utils.ts"
import { CanvasBackdrop } from "../components/canvas-backdrop.tsx"

let rememberedScale = 3
const SCALES = [1, 2, 3, 4]

export function McStage({ children, hint, className }: { children(scale: number): ReactNode; hint?: string; className?: string }) {
  const [scale, setScale] = useState(rememberedScale)
  const choose = (next: number) => {
    rememberedScale = next
    setScale(next)
  }
  return (
    <div className={cn("relative grid size-full place-items-center overflow-auto p-6", className)}>
      <CanvasBackdrop />
      <div className="relative flex flex-col items-center gap-3">
        {children(scale)}
        {hint && <p className="max-w-md text-center text-xs text-fg-muted">{hint}</p>}
      </div>
      {/* The view card: floats at the bottom left, like the tool cards of the other editors. */}
      <div role="group" aria-label="GUI scale" className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg bg-bg p-1 shadow-md">
        <span className="px-1.5 text-xs text-fg-muted">GUI scale</span>
        {SCALES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={scale === s}
            onClick={() => choose(s)}
            className={cn(
              "h-6 w-6 rounded-md text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              scale === s ? "bg-brand text-on-brand" : "text-fg-muted hover:bg-surface-hover hover:text-fg",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
