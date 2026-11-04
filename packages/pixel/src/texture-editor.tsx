// The pixel texture editor: paint 16x16 textures (and animated strips) with the brushes.
// Custom component: shadcn has no pixel canvas; it arranges shadcn buttons, tooltips,
// switches and inputs around one <canvas>.
//
//   ┌────┐     ┌───────────────────────┐     ┌──────────┐
//   │ ✎  │     │                       │     │ ■ colour │
//   │ ⌫  │     │    16 x 16 pixels     │     │ palette  │
//   │ ▨  │     │   (onion skin under)  │     │ texture  │
//   │ ⊙  │     │                       │     │ preview  │
//   │ ⇋  │     └───────────────────────┘     └──────────┘
//   └────┘      [ 1 ][ 2 ][ + ]  4 ticks ▶     <- frames (animated textures)
//
// One finished stroke = one `onChange` = one undo step. Between strokes the editor keeps
// the decoded frames; when `value` changes from outside (undo, import) it decodes again.
import {
  Copy, Eraser, FlipHorizontal2, FlipVertical2, ImageUp, Layers, Paintbrush, PaintBucket, Pause, Pipette, Play, Plus, Trash2,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import {
  Button, cn, Kbd, NumberInput, Separator, Switch, toast, Tooltip, TooltipContent, TooltipTrigger, useThemeToken,
} from "@blocksy/ui"
import { applyBrush, BRUSHES, strokePoints, type Brush, type Mirror } from "./brushes.ts"
import { cloneImage, createImage, imageSurface, parseHex, toCss, toHex, toRgbaBytes, usedColors, type Color, type PixelImage } from "./image.ts"
import { DEFAULT_PALETTE } from "./palette.ts"
import { decodePng } from "./png.ts"
import { DEFAULT_ANIMATION, readFrames, writeFrames, type TextureAnimation, type TextureValue } from "./texture.ts"

const BRUSH_ICONS: Record<Brush["id"], LucideIcon> = { pencil: Paintbrush, eraser: Eraser, fill: PaintBucket, picker: Pipette }

export interface TextureEditorProps {
  value: TextureValue
  onChange(value: TextureValue): void
  /** Frame size in pixels (16 for items and blocks). */
  size?: number
  /** Allow more than one frame (animated textures). */
  animated?: boolean
  className?: string
}

/** A small icon button with a tooltip naming it and its shortcut. */
function ToolButton({ label, keys, Icon, active, onClick, disabled }: { label: string; keys?: string; Icon: LucideIcon; active?: boolean; onClick(): void; disabled?: boolean }) {
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
            className={cn("text-fg-muted transition-transform duration-150 ease-out active:scale-95", active && "bg-surface-hover text-fg")}
          />
        }
      >
        <Icon strokeWidth={1.75} />
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label}
        {keys && <Kbd>{keys}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

/** A white floating card on the grey canvas (docs/design/visual-editor(assets).jpg). */
function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl bg-bg/95 shadow-md backdrop-blur-md", className)}>{children}</div>
}

/** Draws a frame into a 2D context at the given scale (one texture pixel = `scale` px). */
function drawFrame(ctx: CanvasRenderingContext2D, frame: PixelImage, scale: number, alpha = 1) {
  const bytes = toRgbaBytes(frame)
  const data = new ImageData(new Uint8ClampedArray(bytes), frame.width, frame.height)
  const tmp = new OffscreenCanvas(frame.width, frame.height)
  tmp.getContext("2d")!.putImageData(data, 0, 0)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, frame.width * scale, frame.height * scale)
  ctx.restore()
}

/** A tiny live preview at game size (2x), playing the animation when asked. */
function Preview({ frames, animation, playing }: { frames: PixelImage[]; animation: TextureAnimation | null; playing: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!playing || frames.length < 2) return
    const ms = (animation?.frametime ?? DEFAULT_ANIMATION.frametime) * 50 // one tick = 50 ms
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [playing, frames.length, animation?.frametime])
  useEffect(() => {
    const ctx = ref.current?.getContext("2d")
    const frame = frames[tick % frames.length]
    if (!ctx || !frame) return
    ctx.clearRect(0, 0, 64, 64)
    drawFrame(ctx, frame, 64 / frame.width)
  }, [frames, tick])
  return <canvas ref={ref} width={64} height={64} aria-label="Texture preview" className="size-8 [image-rendering:pixelated]" />
}

export function TextureEditor({ value, onChange, size = 16, animated = true, className }: TextureEditorProps) {
  const [frames, setFrames] = useState<PixelImage[]>(() => [createImage(size, size)])
  const [current, setCurrent] = useState(0)
  const [brush, setBrush] = useState<Brush>(BRUSHES[0]!)
  const [color, setColor] = useState<Color>(DEFAULT_PALETTE[17]!)
  const [mirror, setMirror] = useState<Mirror>({ x: false, y: false })
  const [onion, setOnion] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState<[number, number] | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The PNG we last wrote: when `value` comes back with it, there is nothing to decode.
  const written = useRef<string | null | undefined>(undefined)
  // The frame being painted during a stroke (null when not painting).
  const stroke = useRef<{ image: PixelImage; last: [number, number] } | null>(null)
  const previousBrush = useRef<Brush>(BRUSHES[0]!)

  const checkerA = useThemeToken("surface")
  const checkerB = useThemeToken("surface-pressed")
  const gridColor = useThemeToken("line-subtle")
  const fgColor = useThemeToken("fg")

  // Decode when the value changes from outside (first load, undo/redo, import).
  useEffect(() => {
    if (value.png === written.current) return
    let cancelled = false
    readFrames(value.png, size)
      .then((decoded) => {
        if (cancelled) return
        written.current = value.png
        setFrames(decoded)
        setCurrent((c) => Math.min(c, decoded.length - 1))
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
    return () => {
      cancelled = true
    }
  }, [value.png, size])

  const frame = frames[current] ?? frames[0]!

  /** Saves frames as the new value (one undo step). */
  const commit = (next: PixelImage[], animation = value.animation) => {
    const out = writeFrames(next, animation)
    written.current = out.png
    setFrames(next)
    onChange(out)
  }

  // --- drawing the canvas ---
  const redraw = (shown: PixelImage = stroke.current?.image ?? frame) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const px = canvas.width / size
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Checkerboard: two squares per pixel, so transparency is easy to see.
    const half = px / 2
    for (let y = 0; y < size * 2; y++) {
      for (let x = 0; x < size * 2; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? checkerA : checkerB
        ctx.fillRect(x * half, y * half, half + 0.5, half + 0.5)
      }
    }
    // Onion skin: the previous frame, faint, under the current one.
    if (onion && current > 0) drawFrame(ctx, frames[current - 1]!, px, 0.28)
    drawFrame(ctx, shown, px)
    // Pixel grid.
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < size; i++) {
      const p = Math.round(i * px) + 0.5
      ctx.moveTo(p, 0)
      ctx.lineTo(p, canvas.height)
      ctx.moveTo(0, p)
      ctx.lineTo(canvas.width, p)
    }
    ctx.stroke()
    // The pixel under the cursor.
    if (hover) {
      ctx.strokeStyle = fgColor
      ctx.lineWidth = Math.max(1, px / 12)
      ctx.strokeRect(hover[0] * px + 1, hover[1] * px + 1, px - 2, px - 2)
    }
  }

  // Keep the canvas sharp: its backing size follows its CSS size times the screen's pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const css = canvas.clientWidth
      const backing = Math.round((css * dpr) / size) * size // whole pixels per texture pixel
      if (canvas.width !== backing) {
        canvas.width = backing
        canvas.height = backing
      }
      redraw()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  })

  useEffect(() => redraw())

  // --- painting ---
  const cellAt = (e: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size)
    return [Math.min(size - 1, Math.max(0, x)), Math.min(size - 1, Math.max(0, y))]
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) return
    const [x, y] = cellAt(e)
    // Right-click picks a colour with any tool (a common pixel-editor habit).
    const active = e.button === 2 ? BRUSHES.find((b) => b.id === "picker")! : brush
    if (active.id === "picker") {
      const picked = imageSurface(frame).get(x, y)
      if ((picked & 255) > 0) setColor(picked)
      if (brush.id === "picker") setBrush(previousBrush.current) // back to the tool you were using
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const image = cloneImage(frame)
    applyBrush(active, imageSurface(image), x, y, { color }, mirror)
    stroke.current = { image, last: [x, y] }
    redraw(image)
    if (!active.continuous) finishStroke()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const [x, y] = cellAt(e)
    if (!hover || hover[0] !== x || hover[1] !== y) setHover([x, y])
    const s = stroke.current
    if (!s || !brush.continuous) return
    if (s.last[0] === x && s.last[1] === y) return
    for (const [px, py] of strokePoints(s.last[0], s.last[1], x, y).slice(1)) applyBrush(brush, imageSurface(s.image), px, py, { color }, mirror)
    s.last = [x, y]
    redraw(s.image)
  }

  const finishStroke = () => {
    const s = stroke.current
    stroke.current = null
    if (!s) return
    if (s.image.pixels.every((p, i) => p === frame.pixels[i])) return // nothing changed
    commit(frames.map((f, i) => (i === current ? s.image : f)))
  }

  const pickBrush = (next: Brush) => {
    if (next.id === "picker" && brush.id !== "picker") previousBrush.current = brush
    setBrush(next)
  }

  // --- frames ---
  const addFrame = (copy: boolean) => {
    const next = [...frames.slice(0, current + 1), copy ? cloneImage(frame) : createImage(size, size), ...frames.slice(current + 1)]
    commit(next, value.animation ?? DEFAULT_ANIMATION)
    setCurrent(current + 1)
  }
  const deleteFrame = () => {
    if (frames.length < 2) return
    const next = frames.filter((_, i) => i !== current)
    setCurrent(Math.max(0, current - 1))
    commit(next)
  }
  const setAnimation = (patch: Partial<TextureAnimation>) => {
    const animation = { ...(value.animation ?? DEFAULT_ANIMATION), ...patch }
    written.current = value.png
    onChange({ png: value.png ?? writeFrames(frames, animation).png, animation })
  }

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
      if (!animated && image.height !== size) throw new Error(`Textures here are ${size}x${size} pixels.`)
      written.current = undefined // decode it through the normal path
      const imported = writeFrames(
        Array.from({ length: image.height / size }, (_, f) => ({ width: size, height: size, pixels: image.pixels.slice(f * size * size, (f + 1) * size * size) })),
        value.animation,
      )
      setCurrent(0)
      onChange(imported)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  // --- keyboard shortcuts (single keys, like Aseprite/Blockbench), not while typing ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return
      const key = e.key.toUpperCase()
      const match = BRUSHES.find((b) => b.shortcut === key)
      if (match) pickBrush(match)
      else if (key === "M") setMirror((m) => ({ ...m, x: !m.x }))
      else if (key === "O") setOnion((o) => !o)
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const textureColors = useMemo(() => usedColors(frames, 12), [frames])
  const isAnimated = frames.length > 1

  return (
    <div className={cn("relative flex size-full items-center justify-center gap-6 px-6 pt-6 pb-36", className)}>
      {/* Tools island, vertical, on the left. */}
      <Card className="flex shrink-0 flex-col items-center gap-1 p-1">
        {BRUSHES.map((b) => (
          <ToolButton key={b.id} label={b.name} keys={b.shortcut} Icon={BRUSH_ICONS[b.id]} active={brush.id === b.id} onClick={() => pickBrush(b)} />
        ))}
        <Separator className="my-0.5 w-5 bg-line-subtle" />
        <ToolButton label="Mirror left and right" keys="M" Icon={FlipHorizontal2} active={mirror.x} onClick={() => setMirror((m) => ({ ...m, x: !m.x }))} />
        <ToolButton label="Mirror top and bottom" Icon={FlipVertical2} active={mirror.y} onClick={() => setMirror((m) => ({ ...m, y: !m.y }))} />
        {animated && <ToolButton label="Onion skin (show the previous frame)" keys="O" Icon={Layers} active={onion} onClick={() => setOnion((o) => !o)} />}
      </Card>

      {/* The pixel canvas. */}
      <div className="relative aspect-square w-full max-w-[min(56vh,440px)] min-w-40">
        <canvas
          ref={canvasRef}
          aria-label={`Texture canvas, ${size} by ${size} pixels. ${brush.name} selected.`}
          className={cn("size-full touch-none rounded-lg shadow-md [image-rendering:pixelated]", brush.id === "picker" ? "cursor-copy" : "cursor-crosshair")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={() => setHover(null)}
          onContextMenu={(e) => e.preventDefault()}
        />
        {hover && (
          <span className="pointer-events-none absolute -bottom-6 left-0 font-mono text-xs text-fg-faint tabular-nums">
            {hover[0]}, {hover[1]}
          </span>
        )}
      </div>

      {/* Colour, palette, preview. */}
      <Card className="flex w-44 shrink-0 flex-col gap-3 p-3">
        <label className="flex items-center gap-2.5" title="Pick any colour">
          <span className="relative size-8 shrink-0 overflow-hidden rounded-md shadow-[inset_0_0_0_1px_var(--b-line)]" style={{ background: toCss(color) }}>
            <input
              type="color"
              aria-label="Colour"
              value={toHex(color)}
              onChange={(e) => setColor(parseHex(e.target.value) ?? color)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </span>
          <span className="font-mono text-xs text-fg-muted uppercase" data-selectable>
            {toHex(color)}
          </span>
        </label>
        <div>
          <p className="mb-1.5 text-xs text-fg-muted">Palette</p>
          <div className="grid grid-cols-6 gap-1">
            {DEFAULT_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${toHex(c)}`}
                aria-pressed={c === color}
                onClick={() => setColor(c)}
                className={cn(
                  "aspect-square rounded-xs shadow-[inset_0_0_0_1px_var(--b-line-subtle)] transition-transform duration-150 ease-out hover:scale-110",
                  c === color && "ring-2 ring-fg ring-offset-1 ring-offset-bg",
                )}
                style={{ background: toCss(c) }}
              />
            ))}
          </div>
        </div>
        {textureColors.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-fg-muted">In this texture</p>
            <div className="grid grid-cols-6 gap-1">
              {textureColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${toHex(c)}`}
                  onClick={() => setColor(c)}
                  className={cn("aspect-square rounded-xs transition-transform duration-150 ease-out hover:scale-110", c === color && "ring-2 ring-fg ring-offset-1 ring-offset-bg")}
                  style={{ background: toCss(c) }}
                />
              ))}
            </div>
          </div>
        )}
        <Separator className="bg-line-subtle" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-md bg-surface">
              <Preview frames={frames} animation={value.animation} playing={playing} />
            </span>
            <span className="text-xs text-fg-muted">In game</span>
          </div>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Import a PNG" className="text-fg-muted" onClick={() => fileInput.current?.click()} />}>
              <ImageUp strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent>Import a PNG</TooltipContent>
          </Tooltip>
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
        </div>
      </Card>

      {/* Frames (animated textures), above the editor's own toolbar. */}
      {animated && (
        <div className="absolute inset-x-0 bottom-20 flex justify-center px-4">
          <Card className="flex max-w-full items-center gap-1.5 overflow-x-auto p-1.5">
            {frames.map((f, i) => (
              <FrameThumb key={i} frame={f} index={i} active={i === current} onClick={() => setCurrent(i)} />
            ))}
            <ToolButton label="New frame" Icon={Plus} onClick={() => addFrame(false)} />
            <ToolButton label="Duplicate frame" Icon={Copy} onClick={() => addFrame(true)} />
            <ToolButton label="Delete frame" Icon={Trash2} disabled={frames.length < 2} onClick={deleteFrame} />
            {isAnimated && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-5 bg-line-subtle" />
                <label className="flex items-center gap-1.5 text-xs text-fg-muted" title="How long each frame shows. 20 ticks = 1 second.">
                  <NumberInput
                    value={value.animation?.frametime ?? DEFAULT_ANIMATION.frametime}
                    min={1}
                    max={200}
                    step={1}
                    onCommit={(frametime) => setAnimation({ frametime: Math.round(frametime) })}
                    className="h-7 w-12"
                  />
                  ticks
                </label>
                <label className="flex items-center gap-1.5 pl-1 text-xs text-fg-muted" title="Blend smoothly between frames">
                  <Switch size="sm" checked={value.animation?.interpolate ?? false} onCheckedChange={(interpolate) => setAnimation({ interpolate })} />
                  Blend
                </label>
                <ToolButton label={playing ? "Pause preview" : "Play preview"} Icon={playing ? Pause : Play} active={playing} onClick={() => setPlaying((p) => !p)} />
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

/** One frame in the strip: a small picture of it. */
function FrameThumb({ frame, index, active, onClick }: { frame: PixelImage; index: number; active: boolean; onClick(): void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, 32, 32)
    drawFrame(ctx, frame, 32 / frame.width)
  }, [frame])
  return (
    <button
      type="button"
      aria-label={`Frame ${index + 1}`}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-surface transition-colors", active ? "ring-2 ring-brand" : "hover:bg-surface-hover")}
    >
      <canvas ref={ref} width={32} height={32} className="size-6 [image-rendering:pixelated]" />
    </button>
  )
}
