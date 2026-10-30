// PixelLoader: a 3×3 grid of tiny squares that light up in a loop, like a block
// being placed pixel by pixel. Custom because shadcn has no dot-matrix loader.
// It inherits the text colour (text-brand, text-fg-muted, ...).
//
//   ■ □ □      □ ■ □      □ □ ■
//   □ □ □  →   □ □ □  →   □ □ □  → ... around the edge, centre last
//   □ □ □      □ □ □      □ □ □
import { cn } from "../lib/utils.ts"

// Order the cells light up in: clockwise around the edge, then the centre.
const ORDER = [0, 1, 2, 5, 8, 7, 6, 3, 4]
const STEP = 0.11 // seconds between neighbouring cells

export function PixelLoader({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-grid size-3.5 shrink-0 grid-cols-3 gap-px p-px", className)}>
      {Array.from({ length: 9 }, (_, cell) => (
        <span
          key={cell}
          className="rounded-[1px] bg-current animate-[blocksy-pixel_1s_linear_infinite]"
          style={{ animationDelay: `${ORDER.indexOf(cell) * STEP}s` }}
        />
      ))}
    </span>
  )
}
