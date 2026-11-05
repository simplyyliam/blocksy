// The paint studio: a real pixel editor for item and block textures (Paint mode).
// Custom component (shadcn has no pixel canvas); it arranges shadcn buttons, tooltips,
// checkboxes and inputs around one <canvas>. In the spirit of Blockbench's paint mode and Aseprite.
//
//   ┌ viewport (zoom with the wheel, pan with Space or middle mouse) ┬ colour ─────────┐
//   │ [tools]        the picture, grid, pixel coordinates            │ HSV, hex, recent │
//   │                                                                │ layers           │
//   │ 400%  Fit  1:1  Grid  Coords                                   │ preview / tiles  │
//   ├ timeline: frames ▢ ▢ ▢ +  ⧉  🗑   4 ticks  ☐ blend  ▶ ────────┴──────────────────┘
//
// One finished stroke = one `onChange` = one undo step. The editor keeps its layers in state
// and decodes again only when the value changes from outside (undo, import).
import {
  Copy, Eraser, Eye, EyeOff, FlipHorizontal2, FlipVertical2, Grid3x3, Hash, ImageUp, Layers, Maximize, MoveDown, MoveUp, Paintbrush, PaintBucket, Pause, Pipette,
  Play, Plus, Trash2, ZoomIn, ZoomOut, type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { Button, Checkbox, cn, drawCube, Kbd, NumberInput, Separator, toast, Tooltip, TooltipContent, TooltipTrigger, useThemeToken, type McSprite } from "@blocksy/ui"
import { applyBrush, BRUSHES, strokePoints, type Brush, type Mirror } from "./brushes.ts"
import { ColorPicker } from "./color-picker.tsx"
import { cloneImage, createImage, imageSurface, joinFrames, toCss, toHex, toRgbaBytes, usedColors, type Color, type PixelImage } from "./image.ts"
import {
  addLayer, flattenAll, flattenFrame, frameCountOf, insertFrame, loadLayers, moveLayer, patchLayer, removeFrame, removeLayer, singleLayer, storeLayers,
  type PaintLayer,
} from "./layers.ts"
import { DEFAULT_PALETTE } from "./palette.ts"
import { decodePng, encodePng } from "./png.ts"
import { DEFAULT_ANIMATION, readFrames, type TextureAnimation, type TextureValue } from "./texture.ts"
import { clampPan, fitView, inside, oneToOne, stepZoom, toPixel, type View } from "./viewport.ts"

const BRUSH_ICONS: Record<Brush["id"], LucideIcon> = { pencil: Paintbrush, eraser: Eraser, fill: PaintBucket, picker: Pipette }
const RECENT_LIMIT = 12

export interface PaintStudioProps {
  value: TextureValue
  onChange(value: TextureValue): void
  /** Frame size in pixels (16 for items and blocks). */
  size?: number
  /** What the texture is for: items preview flat, blocks preview tiled and as a cube. */
  kind: "item" | "block"
  className?: string
}

/** A tool button with a tooltip naming it and its key; an active tool is clearly tinted. */
function Tool({ label, keys, Icon, active, onClick, disabled, side = "right" }: { label: string; keys?: string; Icon: LucideIcon; active?: boolean; onClick(): void; disabled?: boolean; side?: "right" | "top" | "bottom" }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn("size-7 rounded-md text-fg-muted active:scale-95", active && "bg-brand/15 text-brand ring-1 ring-brand/40 hover:bg-brand/20")}
          />
        }
      >
        <Icon strokeWidth={1.75} className="size-4" />
      </TooltipTrigger>
      <TooltipContent side={side} className="flex items-center gap-2">
        {label}
        {keys && <Kbd>{keys}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

const Card = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg bg-bg/95 shadow-md backdrop-blur-md", className)} {...rest}>
    {children}
  </div>
)

/** A section of the right panel: a small title, then its content. */
function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line-subtle last:border-b-0">
      <div className="flex h-6.5 items-center justify-between bg-surface-hover/50 pr-1 pl-3">
        <h3 className="text-xs font-medium text-fg">{title}</h3>
        {action}
      </div>
      <div className="px-3 py-2">{children}</div>
    </section>
  )
}

function toCanvas(image: PixelImage): OffscreenCanvas {
  const canvas = new OffscreenCanvas(image.width, image.height)
  canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(toRgbaBytes(image)), image.width, image.height), 0, 0)
  return canvas
}

/** A flat picture as a sprite the renderer can draw (for the cube preview). */
function asSprite(image: PixelImage): McSprite {
  return {
    image: toCanvas(image),
    width: image.width,
    height: image.height,
    frameWidth: image.width,
    frameHeight: image.height,
    sequence: [{ index: 0, time: 1 }],
    interpolate: false,
    scaling: { type: "stretch" },
  }
}

export function PaintStudio({ value, onChange, size = 16, kind, className }: PaintStudioProps) {
  const [layers, setLayers] = useState<PaintLayer[]>(() => singleLayer([createImage(size, size)]))
  const [active, setActive] = useState(0)
  const [current, setCurrent] = useState(0)
  const [brush, setBrush] = useState<Brush>(BRUSHES[0]!)
  const [color, setColor] = useState<Color>(DEFAULT_PALETTE[17]!)
  const [recent, setRecent] = useState<Color[]>([])
  const [mirror, setMirror] = useState<Mirror>({ x: false, y: false })
  const [onion, setOnion] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [grid, setGrid] = useState(true)
  const [coords, setCoords] = useState(false)
  const [view, setView] = useState<View | null>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [tick, setTick] = useState(0)

  const viewport = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const written = useRef<string | null | undefined>(undefined)
  const stroke = useRef<{ image: PixelImage; last: [number, number] } | null>(null)
  const panning = useRef<{ x: number; y: number; view: View } | null>(null)
  const previousBrush = useRef<Brush>(BRUSHES[0]!)

  const checkerA = useThemeToken("surface")
  const checkerB = useThemeToken("surface-pressed")
  const gridColor = useThemeToken("line")
  const fgColor = useThemeToken("fg")
  const bgColor = useThemeToken("surface-hover")

  const layer = layers[active] ?? layers[0]!
  const frameCount = frameCountOf(layers)
  const frame = Math.min(current, frameCount - 1)

  // --- loading: decode when the value changes from outside (first load, undo/redo, import) ---
  useEffect(() => {
    if (value.png === written.current) return
    let cancelled = false
    void (async () => {
      let next: PaintLayer[] | null = null
      if (value.layers && value.layers.length > 0) {
        next = await loadLayers(value.layers, size)
        // The saved layers must still add up to the saved picture, else the picture wins.
        if (next && encodePng(joinFrames(flattenAll(next, size))) !== value.png) next = null
      }
      next ??= singleLayer(await readFrames(value.png, size))
      if (cancelled) return
      written.current = value.png
      setLayers(next)
      setActive((a) => Math.min(a, next.length - 1))
      setCurrent((c) => Math.min(c, frameCountOf(next) - 1))
    })().catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
    return () => {
      cancelled = true
    }
  }, [value.png, value.layers, size])

  /** Saves the layers as the new value (one undo step). */
  const commit = (next: PaintLayer[], animation: TextureAnimation | null = value.animation) => {
    const flat = flattenAll(next, size)
    const png = encodePng(joinFrames(flat))
    written.current = png
    setLayers(next)
    onChange({ png, animation: flat.length > 1 ? (animation ?? DEFAULT_ANIMATION) : null, layers: next.length > 1 ? storeLayers(next) : null })
  }

  // --- the view: fit once the window size is known, then follow the user ---
  const size2 = useRef({ w: 0, h: 0 })
  const fit = () => setView(fitView(size2.current.w, size2.current.h, size, size))
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      size2.current = { w: el.clientWidth, h: el.clientHeight }
      setView((v) => v ?? fitView(el.clientWidth, el.clientHeight, size, size))
      setTick((t) => t + 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [size])

  // Wheel zoom needs a non-passive listener (to stop the page from scrolling).
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      setView((v) => (v ? clampPan(stepZoom(v, e.deltaY < 0 ? 1 : -1, e.clientX - rect.left, e.clientY - rect.top), el.clientWidth, el.clientHeight, size, size) : v))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [size])

  // Animated preview clock.
  useEffect(() => {
    if (!playing || frameCount < 2) return
    const id = setInterval(() => setTick((t) => t + 1), (value.animation?.frametime ?? DEFAULT_ANIMATION.frametime) * 50)
    return () => clearInterval(id)
  }, [playing, frameCount, value.animation?.frametime])

  // --- drawing the viewport ---
  const draw = () => {
    const canvas = canvasRef.current
    const el = viewport.current
    if (!canvas || !el || !view) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(el.clientWidth * dpr)
    canvas.height = Math.round(el.clientHeight * dpr)
    const ctx = canvas.getContext("2d")!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, el.clientWidth, el.clientHeight)
    const { zoom, panX, panY } = view
    const w = size * zoom

    // Transparency checkerboard: two squares per picture pixel.
    const half = zoom / 2
    ctx.save()
    ctx.beginPath()
    ctx.rect(panX, panY, w, w)
    ctx.clip()
    for (let y = 0; y < size * 2; y++) {
      for (let x = 0; x < size * 2; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? checkerA : checkerB
        ctx.fillRect(panX + x * half, panY + y * half, half + 0.5, half + 0.5)
      }
    }
    ctx.restore()

    // Onion skin (the frame before), then the picture with the stroke in progress.
    if (onion && frame > 0) {
      ctx.globalAlpha = 0.28
      ctx.drawImage(toCanvas(flattenFrame(layers, frame - 1, size)), panX, panY, w, w)
      ctx.globalAlpha = 1
    }
    const live = stroke.current ? layers.map((l, i) => (i === active ? { ...l, frames: l.frames.map((f, fi) => (fi === frame ? stroke.current!.image : f)) } : l)) : layers
    ctx.drawImage(toCanvas(flattenFrame(live, frame, size)), panX, panY, w, w)

    // Pixel grid (only when the pixels are big enough to be worth it).
    if (grid && zoom >= 6) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      for (let i = 0; i <= size; i++) {
        const p = Math.round(i * zoom)
        ctx.moveTo(panX + p + 0.5, panY)
        ctx.lineTo(panX + p + 0.5, panY + w)
        ctx.moveTo(panX, panY + p + 0.5)
        ctx.lineTo(panX + w, panY + p + 0.5)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    } else {
      ctx.strokeStyle = gridColor
      ctx.strokeRect(panX + 0.5, panY + 0.5, w, w)
    }

    // Pixel coordinates along the top and left edges.
    if (coords && zoom >= 10) {
      ctx.fillStyle = fgColor
      ctx.font = "10px ui-monospace, monospace"
      ctx.textAlign = "center"
      for (let i = 0; i < size; i++) {
        ctx.fillText(String(i), panX + i * zoom + zoom / 2, panY - 5)
        ctx.textAlign = "right"
        ctx.fillText(String(i), panX - 5, panY + i * zoom + zoom / 2 + 3)
        ctx.textAlign = "center"
      }
    }

    // Mirror axes.
    ctx.strokeStyle = "#e5484d"
    ctx.setLineDash([4, 3])
    if (mirror.x) {
      ctx.beginPath()
      ctx.moveTo(panX + w / 2 + 0.5, panY - 8)
      ctx.lineTo(panX + w / 2 + 0.5, panY + w + 8)
      ctx.stroke()
    }
    if (mirror.y) {
      ctx.beginPath()
      ctx.moveTo(panX - 8, panY + w / 2 + 0.5)
      ctx.lineTo(panX + w + 8, panY + w / 2 + 0.5)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // The pixel under the cursor.
    if (hover && inside(hover[0], hover[1], size, size) && !spaceDown) {
      ctx.strokeStyle = fgColor
      ctx.lineWidth = Math.max(1, zoom / 12)
      ctx.strokeRect(panX + hover[0] * zoom + 1, panY + hover[1] * zoom + 1, zoom - 2, zoom - 2)
    }
  }
  useEffect(draw)

  // --- painting and panning ---
  const local = (e: ReactPointerEvent<HTMLElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  const finishStroke = () => {
    const s = stroke.current
    stroke.current = null
    panning.current = null
    if (!s) return
    const before = layer.frames[frame]!
    if (s.image.pixels.every((p, i) => p === before.pixels[i])) return draw() // nothing changed
    setRecent((r) => [color, ...r.filter((c) => c !== color)].slice(0, RECENT_LIMIT))
    commit(layers.map((l, i) => (i === active ? { ...l, frames: l.frames.map((f, fi) => (fi === frame ? s.image : f)) } : l)))
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!view) return
    const [sx, sy] = local(e)
    // Middle button, or Space + drag: pan.
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.currentTarget.setPointerCapture(e.pointerId)
      panning.current = { x: e.clientX, y: e.clientY, view }
      return
    }
    if (e.button !== 0 && e.button !== 2) return
    const [x, y] = toPixel(view, sx, sy)
    if (!inside(x, y, size, size)) return
    // Right-click picks a colour with any tool, like most pixel editors.
    const tool = e.button === 2 ? BRUSHES.find((b) => b.id === "picker")! : brush
    const flat = flattenFrame(layers, frame, size)
    if (tool.id === "picker") {
      const picked = imageSurface(flat).get(x, y)
      if ((picked & 255) > 0) setColor(picked)
      if (brush.id === "picker") setBrush(previousBrush.current)
      return
    }
    if (!layer.visible) return toast("This layer is hidden. Show it to paint on it.")
    e.currentTarget.setPointerCapture(e.pointerId)
    const image = cloneImage(layer.frames[frame]!)
    applyBrush(tool, imageSurface(image), x, y, { color }, mirror)
    stroke.current = { image, last: [x, y] }
    draw()
    if (!tool.continuous) finishStroke()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!view) return
    const p = panning.current
    if (p) {
      const el = viewport.current!
      setView(clampPan({ ...p.view, panX: p.view.panX + e.clientX - p.x, panY: p.view.panY + e.clientY - p.y }, el.clientWidth, el.clientHeight, size, size))
      return
    }
    const [sx, sy] = local(e)
    const [x, y] = toPixel(view, sx, sy)
    if (!hover || hover[0] !== x || hover[1] !== y) setHover([x, y])
    const s = stroke.current
    if (!s || !brush.continuous || (s.last[0] === x && s.last[1] === y)) return
    for (const [px, py] of strokePoints(s.last[0], s.last[1], x, y).slice(1)) applyBrush(brush, imageSurface(s.image), px, py, { color }, mirror)
    s.last = [x, y]
    draw()
  }

  const pickBrush = (next: Brush) =>
    setBrush((prev) => {
      if (next.id === "picker" && prev.id !== "picker") previousBrush.current = prev
      return next
    })

  // --- frames and layers ---
  const addFrame = (copy: boolean) => {
    commit(insertFrame(layers, frame, size, copy), value.animation ?? DEFAULT_ANIMATION)
    setCurrent(frame + 1)
  }
  const deleteFrame = () => {
    if (frameCount < 2) return
    setCurrent(Math.max(0, frame - 1))
    commit(removeFrame(layers, frame))
  }
  const setAnimation = (patch: Partial<TextureAnimation>) => {
    const animation = { ...(value.animation ?? DEFAULT_ANIMATION), ...patch }
    written.current = value.png
    onChange({ ...value, animation })
  }
  const flatFrames = useMemo(() => flattenAll(layers, size), [layers, size])

  // --- import ---
  const fileInput = useRef<HTMLInputElement>(null)
  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      const image = await decodePng(url.slice(url.indexOf(",") + 1))
      if (image.width !== size || image.height % size !== 0 || image.height === 0) {
        throw new Error(`That image is ${image.width}x${image.height}. Textures are ${size}x${size} (or ${size} wide with frames stacked below each other).`)
      }
      if (kind === "block" && image.height !== size) throw new Error(`Block textures here are ${size}x${size} pixels.`)
      written.current = undefined // decode it through the normal path, as a single layer
      setCurrent(0)
      setActive(0)
      const strip = encodePng(image)
      onChange({ png: strip, animation: image.height > size ? (value.animation ?? DEFAULT_ANIMATION) : null, layers: null })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  // --- keyboard (single keys, like Aseprite and Blockbench), not while typing ---
  const keys = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keys.current = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return
      if (e.code === "Space") {
        e.preventDefault()
        return setSpaceDown(true)
      }
      const key = e.key.toUpperCase()
      const el = viewport.current
      const match = BRUSHES.find((b) => b.shortcut === key)
      if (match) pickBrush(match)
      else if (key === "M") setMirror((m) => (e.shiftKey ? { ...m, y: !m.y } : { ...m, x: !m.x }))
      else if (key === "O") setOnion((o) => !o)
      else if (key === "H") setGrid((g) => !g)
      else if (key === "C") setCoords((c) => !c)
      else if (key === "F") fit()
      else if (e.key === "1" && el) setView(oneToOne(el.clientWidth, el.clientHeight, size, size))
      else if ((e.key === "+" || e.key === "=") && el) setView((v) => v && stepZoom(v, 1, el.clientWidth / 2, el.clientHeight / 2))
      else if (e.key === "-" && el) setView((v) => v && stepZoom(v, -1, el.clientWidth / 2, el.clientHeight / 2))
      else if (e.key === ",") setCurrent((c) => Math.max(0, c - 1))
      else if (e.key === ".") setCurrent((c) => Math.min(frameCount - 1, c + 1))
      else return
      e.preventDefault()
    }
  })
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current(e)
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpaceDown(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  const textureColors = useMemo(() => usedColors(flatFrames, 12), [flatFrames])
  const previewFrame = flatFrames[playing ? tick % flatFrames.length : frame] ?? flatFrames[0]!
  const zoomPercent = view ? view.zoom * 100 : 100

  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      {/* The viewport: leaves room for the right panel and the timeline. */}
      <div ref={viewport} className="absolute top-0 right-[216px] bottom-[92px] left-0">
        <canvas
          ref={canvasRef}
          aria-label={`Texture canvas, ${size} by ${size} pixels. ${brush.name} selected.`}
          className={cn("block size-full touch-none", spaceDown ? "cursor-grab" : brush.id === "picker" ? "cursor-copy" : "cursor-crosshair")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={() => setHover(null)}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Tools: one column, active tool tinted. */}
        <Card className="absolute top-3 left-3 flex flex-col items-center gap-0.5 p-1">
          {BRUSHES.map((b) => (
            <Tool key={b.id} label={b.name} keys={b.shortcut} Icon={BRUSH_ICONS[b.id]} active={brush.id === b.id} onClick={() => pickBrush(b)} />
          ))}
          <Separator className="my-0.5 w-5 bg-line-subtle" />
          <Tool label="Mirror left and right" keys="M" Icon={FlipHorizontal2} active={mirror.x} onClick={() => setMirror((m) => ({ ...m, x: !m.x }))} />
          <Tool label="Mirror top and bottom" keys="Shift M" Icon={FlipVertical2} active={mirror.y} onClick={() => setMirror((m) => ({ ...m, y: !m.y }))} />
          <Tool label="Onion skin (the frame before, faint)" keys="O" Icon={Layers} active={onion} onClick={() => setOnion((o) => !o)} />
          <Separator className="my-0.5 w-5 bg-line-subtle" />
          <Tool label="Import a PNG" Icon={ImageUp} onClick={() => fileInput.current?.click()} />
          <input
            ref={fileInput}
            type="file"
            accept="image/png"
            hidden
            onChange={(e) => {
              void importFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </Card>

        {/* View card: zoom, fit, 1:1, grid and coordinates. */}
        <Card className="absolute bottom-3 left-3 flex items-center gap-0.5 p-1">
          <Tool side="top" label="Zoom out" keys="-" Icon={ZoomOut} onClick={() => setView((v) => v && stepZoom(v, -1, size2.current.w / 2, size2.current.h / 2))} />
          <span className="w-12 text-center text-xs text-fg tabular-nums">{zoomPercent}%</span>
          <Tool side="top" label="Zoom in" keys="+" Icon={ZoomIn} onClick={() => setView((v) => v && stepZoom(v, 1, size2.current.w / 2, size2.current.h / 2))} />
          <Tool side="top" label="Fit to window" keys="F" Icon={Maximize} onClick={fit} />
          <Button variant="ghost" size="xs" className="h-7 rounded-md px-1.5 text-fg-muted" onClick={() => setView(oneToOne(size2.current.w, size2.current.h, size, size))}>
            1:1
          </Button>
          <Separator orientation="vertical" className="mx-0.5 h-5 bg-line-subtle" />
          <Tool side="top" label="Pixel grid" keys="H" Icon={Grid3x3} active={grid} onClick={() => setGrid((g) => !g)} />
          <Tool side="top" label="Pixel coordinates" keys="C" Icon={Hash} active={coords} onClick={() => setCoords((c) => !c)} />
        </Card>

        {hover && inside(hover[0], hover[1], size, size) && (
          <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-bg/90 px-2 py-1 font-mono text-xs text-fg-muted tabular-nums shadow-sm">
            {hover[0]}, {hover[1]}
          </span>
        )}
      </div>

      {/* Right panel: colour, layers, preview. */}
      <aside aria-label="Paint panel" className="absolute top-3 right-3 bottom-[100px] flex w-[200px] flex-col overflow-y-auto rounded-lg bg-bg/95 shadow-md backdrop-blur-md">
        <Section title="Colour">
          <ColorPicker color={color} onChange={setColor} recent={recent} />
          <p className="mt-2 mb-1 text-xs text-fg-muted">Palette</p>
          <div className="grid grid-cols-6 gap-1">
            {DEFAULT_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${toHex(c)}`}
                aria-pressed={c === color}
                onClick={() => setColor(c)}
                className={cn("aspect-square rounded-xs shadow-[inset_0_0_0_1px_var(--b-line-subtle)] hover:scale-110", c === color && "ring-2 ring-fg ring-offset-1 ring-offset-bg")}
                style={{ background: toCss(c) }}
              />
            ))}
          </div>
          {textureColors.length > 0 && (
            <>
              <p className="mt-2 mb-1 text-xs text-fg-muted">In this texture</p>
              <div className="grid grid-cols-6 gap-1">
                {textureColors.map((c) => (
                  <button key={c} type="button" aria-label={`Colour ${toHex(c)}`} onClick={() => setColor(c)} className={cn("aspect-square rounded-xs hover:scale-110", c === color && "ring-2 ring-fg ring-offset-1 ring-offset-bg")} style={{ background: toCss(c) }} />
                ))}
              </div>
            </>
          )}
        </Section>

        <Section
          title="Layers"
          action={
            <div className="flex">
              <Tool side="bottom" label="New layer" Icon={Plus} onClick={() => (commit(addLayer(layers, size, active)), setActive(active + 1))} disabled={layers.length >= 8} />
              <Tool side="bottom" label="Delete layer" Icon={Trash2} disabled={layers.length < 2} onClick={() => (commit(removeLayer(layers, active)), setActive(Math.max(0, active - 1)))} />
            </div>
          }
        >
          <ul className="flex flex-col gap-0.5" aria-label="Layers">
            {layers.map((_, i) => i).reverse().map((i) => {
              const l = layers[i]!
              return (
                <li key={l.id} className={cn("flex h-6.5 items-center gap-1 rounded-md pr-0.5 pl-1", i === active ? "bg-brand/12 ring-1 ring-brand/35" : "hover:bg-surface-hover")}>
                  <button type="button" aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`} onClick={() => commit(patchLayer(layers, i, { visible: !l.visible }))} className="grid size-5 place-items-center text-fg-muted hover:text-fg">
                    {l.visible ? <Eye className="size-3.5" strokeWidth={1.75} /> : <EyeOff className="size-3.5" strokeWidth={1.75} />}
                  </button>
                  <button type="button" onClick={() => setActive(i)} className={cn("min-w-0 flex-1 truncate text-left text-xs", i === active ? "text-fg" : "text-fg-muted", !l.visible && "opacity-60")}>
                    {l.name}
                  </button>
                  <Tool side="bottom" label="Move layer up" Icon={MoveUp} disabled={i === layers.length - 1} onClick={() => (commit(moveLayer(layers, i, i + 1)), setActive(i + 1))} />
                  <Tool side="bottom" label="Move layer down" Icon={MoveDown} disabled={i === 0} onClick={() => (commit(moveLayer(layers, i, i - 1)), setActive(i - 1))} />
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title={kind === "block" ? "Block preview" : "In game"}>
          <Preview kind={kind} image={previewFrame} />
        </Section>
      </aside>

      {/* Timeline: frames, new, duplicate, delete, speed, blend, play. */}
      <Card className="absolute right-3 bottom-3 left-3 flex h-[76px] items-center gap-2 overflow-x-auto px-2" role="group" aria-label="Frames">
        <div className="flex shrink-0 items-center gap-1">
          {flatFrames.map((f, i) => (
            <FrameThumb key={i} frame={f} index={i} active={i === frame} onClick={() => setCurrent(i)} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tool side="top" label="New frame (makes it animated)" Icon={Plus} onClick={() => addFrame(false)} />
          <Tool side="top" label="Duplicate frame" Icon={Copy} onClick={() => addFrame(true)} />
          <Tool side="top" label="Delete frame" Icon={Trash2} disabled={frameCount < 2} onClick={deleteFrame} />
        </div>
        {frameCount > 1 ? (
          <>
            <Separator orientation="vertical" className="h-6 bg-line-subtle" />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-fg-muted" title="How long each frame shows. 20 ticks = 1 second.">
              Speed
              <NumberInput value={value.animation?.frametime ?? DEFAULT_ANIMATION.frametime} min={1} max={200} step={1} unit="ticks" onCommit={(frametime) => setAnimation({ frametime: Math.round(frametime) })} className="w-20" />
            </label>
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-fg-muted" title="Blend smoothly between frames">
              <Checkbox checked={value.animation?.interpolate ?? false} onCheckedChange={(interpolate) => setAnimation({ interpolate: interpolate === true })} />
              Blend
            </label>
            <Tool side="top" label={playing ? "Pause preview" : "Play preview"} Icon={playing ? Pause : Play} active={playing} onClick={() => setPlaying((p) => !p)} />
          </>
        ) : (
          <span className="shrink-0 text-xs text-fg-faint">Add a frame to animate this texture.</span>
        )}
      </Card>
    </div>
  )
}

/** Live preview: items flat at game size, blocks tiled and as a cube (what you will see in game). */
function Preview({ kind, image }: { kind: "item" | "block"; image: PixelImage }) {
  const flat = useRef<HTMLCanvasElement>(null)
  const tiled = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const flatCtx = flat.current?.getContext("2d")
    const tiledCtx = tiled.current?.getContext("2d")
    if (!flatCtx || !tiledCtx) return
    flatCtx.imageSmoothingEnabled = tiledCtx.imageSmoothingEnabled = false
    flatCtx.clearRect(0, 0, 64, 64)
    const source = toCanvas(image)
    if (kind === "block") {
      const sprite = asSprite(image)
      drawCube(flatCtx, { top: sprite, left: sprite, right: sprite }, 0, 0, 64)
    } else {
      flatCtx.drawImage(source, 0, 0, 64, 64)
    }
    // Tiled 3 x 3: how it repeats side by side (blocks tile in the world; items in a slot).
    tiledCtx.clearRect(0, 0, 48, 48)
    const cell = 16
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) tiledCtx.drawImage(source, x * cell, y * cell, cell, cell)
  }, [image, kind])
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col items-center gap-1">
        <canvas ref={flat} width={64} height={64} aria-label={kind === "block" ? "Block preview" : "Item preview"} className="size-16 rounded-md bg-surface [image-rendering:pixelated]" />
        <span className="text-[11px] text-fg-faint">{kind === "block" ? "Cube" : "Item"}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <canvas ref={tiled} width={48} height={48} aria-label="Tiled 3 by 3" className="size-12 rounded-md bg-surface [image-rendering:pixelated]" />
        <span className="text-[11px] text-fg-faint">Tiled</span>
      </div>
    </div>
  )
}

/** One frame in the timeline: a small picture of it. */
function FrameThumb({ frame, index, active, onClick }: { frame: PixelImage; index: number; active: boolean; onClick(): void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext("2d")
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, 32, 32)
    ctx.drawImage(toCanvas(frame), 0, 0, 32, 32)
  }, [frame])
  return (
    <button
      type="button"
      aria-label={`Frame ${index + 1}`}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cn("relative grid size-10 shrink-0 place-items-center rounded-md bg-surface transition-colors", active ? "ring-2 ring-brand" : "hover:bg-surface-hover")}
    >
      <canvas ref={ref} width={32} height={32} className="size-8 [image-rendering:pixelated]" />
      <span className="absolute right-0.5 bottom-0 text-[9px] text-fg-faint tabular-nums">{index + 1}</span>
    </button>
  )
}
