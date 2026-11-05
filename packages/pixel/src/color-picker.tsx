// A proper colour picker for the paint studio: a saturation x value square, a hue slider, a
// hex field and the colours you used last. Custom because shadcn has no colour picker; it only
// arranges an Input around two draggable areas.
//
//   ┌───────────────┐
//   │ ░░░▒▒▒▓▓▓███  │  saturation (left to right) and value (bottom to top)
//   └───────────────┘
//   ▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▏  hue
//   ■ #3A7BD5          ■ ■ ■ ■ ■ ■  recent
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { cn, Input } from "@blocksy/ui"
import { colorFromHsv, hsvOfColor, type Hsv } from "./color.ts"
import { parseHex, toCss, toHex, type Color } from "./image.ts"

/** Drag inside an element: calls back with 0..1 positions while the pointer is down. */
function useDrag(onMove: (x: number, y: number) => void) {
  const active = useRef(false)
  const at = (e: ReactPointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onMove(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)))
  }
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      active.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      at(e)
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => active.current && at(e),
    onPointerUp: () => {
      active.current = false
    },
  }
}

export function ColorPicker({ color, onChange, recent }: { color: Color; onChange(color: Color): void; recent: Color[] }) {
  // Hue is kept here: a grey has no hue, and dragging the square must not reset the slider.
  const [hsv, setHsv] = useState<Hsv>(() => hsvOfColor(color))
  const [hex, setHex] = useState(toHex(color))
  useEffect(() => {
    // The colour changed from outside (palette, eyedropper): follow it, keep the hue for greys.
    if (colorFromHsv(hsv, color & 255) === color) return
    const next = hsvOfColor(color)
    setHsv((prev) => (next.s === 0 || next.v === 0 ? { ...next, h: prev.h } : next))
    setHex(toHex(color))
    // `hsv` is read to compare only; following it would loop.
  }, [color])

  const apply = (next: Hsv) => {
    setHsv(next)
    const c = colorFromHsv(next)
    setHex(toHex(c))
    onChange(c)
  }

  const square = useDrag((x, y) => apply({ ...hsv, s: x, v: 1 - y }))
  const hue = useDrag((x) => apply({ ...hsv, h: Math.min(359.9, x * 360) }))
  const commitHex = () => {
    const parsed = parseHex(hex)
    if (parsed === null) return setHex(toHex(color))
    setHsv(hsvOfColor(parsed))
    onChange(parsed)
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        {...square}
        role="slider"
        aria-label="Saturation and brightness"
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
        tabIndex={0}
        className="relative h-24 w-full cursor-crosshair touch-none rounded-md"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.5)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>
      <div
        {...hue}
        role="slider"
        aria-label="Hue"
        aria-valuenow={Math.round(hsv.h)}
        aria-valuemin={0}
        aria-valuemax={360}
        tabIndex={0}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <span className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.5)]" style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>
      <div className="flex items-center gap-2">
        <span className="size-6 shrink-0 rounded-md shadow-[inset_0_0_0_1px_var(--b-line)]" style={{ background: toCss(color) }} />
        <Input
          value={hex}
          spellCheck={false}
          aria-label="Hex colour"
          onChange={(e) => setHex(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => e.key === "Enter" && commitHex()}
          className="h-6.5 font-mono text-xs uppercase"
        />
      </div>
      {recent.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-fg-muted">Recent</p>
          <div className="flex flex-wrap gap-1">
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${toHex(c)}`}
                onClick={() => {
                  setHsv(hsvOfColor(c))
                  setHex(toHex(c))
                  onChange(c)
                }}
                className={cn("size-4.5 rounded-xs shadow-[inset_0_0_0_1px_var(--b-line-subtle)] transition-transform duration-150 hover:scale-110", c === color && "ring-2 ring-fg ring-offset-1 ring-offset-bg")}
                style={{ background: toCss(c) }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
