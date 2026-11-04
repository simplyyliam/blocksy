// CanvasBackdrop: the quiet dot grid behind editor canvases, fading out towards the edges.
// Blocksy-only arrangement of Magic UI's GridPattern (stock file in ui/): a zero-length dash
// with round caps draws one dot per cell, all from ONE SVG <pattern>.
//
// Why not DotPattern (also stock, still exported): it renders one animated element per dot,
// about 2,400 on an editor canvas, which blocked the page for ~700 ms each time an element
// opened (v0.3 bench, ADR 0010). This looks the same and costs a handful of DOM nodes.
import { cn } from "../lib/utils.ts"
import { GridPattern } from "./ui/grid-pattern.tsx"

export function CanvasBackdrop({ spacing = 18, className }: { spacing?: number; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]", className)}>
      <GridPattern
        width={spacing}
        height={spacing}
        x={0}
        y={0}
        // A dot at the start of each cell's path, then a gap longer than the path: one dot per cell.
        strokeDasharray={`0 ${spacing * 3}`}
        className="fill-transparent stroke-fg-faint opacity-60 [stroke-linecap:round] [stroke-width:1.8]"
      />
    </div>
  )
}
