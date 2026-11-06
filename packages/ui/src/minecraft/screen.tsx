// <McScreen>: a canvas that draws a piece of the game's GUI in Minecraft's own look, at an
// integer scale, with clickable slots laid over it. Previews are always vanilla, in both the
// Modern and the Minecraft theme (decisions: editor-refresh-decisions.md, answer 5).
//
//   <McScreen width={176} height={166} scale={2} needs={{ gui: ["container/furnace"] }}
//             draw={(g) => g.gui("container/furnace", 0, 0, 176, 166, 0, 0)} />
//
// `draw` runs in GUI pixels. Assets are preloaded from `needs` first, so drawing is synchronous.
// Without Minecraft's assets (no build yet) a calm "Build once" card replaces the canvas.
import { useEffect, useReducer, useRef, useState, type ReactElement } from "react"
import { cn } from "../lib/utils.ts"
import { Button } from "./../components/ui/button.tsx"
import { drawGuiSprite, drawRegion, drawText, isAnimated, measureText, TICK_MS } from "./graphics.ts"
import { drawMcItem } from "./item.ts"
import { useMinecraft } from "./provider.tsx"
import type { McAssets, McFont, McItem, McNeeds, McSprite } from "./types.ts"
import { onUserImage } from "./user-images.ts"

export interface McGraphics {
  ctx: CanvasRenderingContext2D
  /** Game ticks since the page loaded (50 ms each): animations follow it. */
  tick: number
  assets: McAssets
  font: McFont | null
  fill(color: string, x: number, y: number, w: number, h: number): void
  /** A GUI sprite (`minecraft:container/slot`), scaled by its own rules. */
  sprite(id: string, x: number, y: number, w: number, h: number): void
  /** A piece of a full GUI picture (`container/furnace`): source rect, then where to draw it. */
  gui(path: string, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw?: number, dh?: number): void
  /** An item or block inside a 16x16 slot area (or any `size`). */
  item(item: McItem, x: number, y: number, size?: number): void
  text(text: string, x: number, y: number, color?: string, shadow?: boolean): void
  measure(text: string): number
}

export interface McSlotRect {
  key: string
  x: number
  y: number
  /** Width and height of the clickable area (18 for a slot with its border). */
  size?: number
  label: string
}

interface Props {
  /** Logical size in GUI pixels. */
  width: number
  height: number
  /** Integer zoom, 1 to 6 (the "GUI scale" of the game). */
  scale?: number
  needs?: McNeeds
  draw(g: McGraphics): void
  slots?: McSlotRect[]
  activeSlot?: string | null
  onSlot?(key: string, event: React.MouseEvent): void
  /** Delete, Backspace or right-click on a slot (empty it). */
  onSlotClear?(key: string): void
  /** Wraps a slot's button, e.g. in an item picker that opens from it. */
  wrapSlot?(slot: McSlotRect, button: ReactElement): ReactElement
  /** Screens made only of the user's own pixels need no Minecraft assets. */
  vanilla?: boolean
  label: string
  className?: string
}

export function McScreen({ width, height, scale = 2, needs = {}, draw, slots = [], activeSlot, onSlot, onSlotClear, wrapSlot, vanilla = true, label, className }: Props) {
  "use no memo" // reads caches that change outside React (assets, user images, the clock)
  const { assets, status, onBuild } = useMinecraft()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [loadedKey, setLoadedKey] = useState("")
  const [, repaint] = useReducer((n: number) => n + 1, 0)
  const animated = useRef(false)
  const needsKey = JSON.stringify(needs)
  const ready = !vanilla || (status === "ready" && assets !== null && loadedKey === needsKey)

  // Load what the screen needs, then paint.
  useEffect(() => {
    if (!vanilla || status !== "ready" || !assets) return
    let alive = true
    void assets.preload(needs).then(() => alive && setLoadedKey(needsKey))
    return () => {
      alive = false
    }
    // `needs` is compared by value through needsKey.
  }, [assets, status, needsKey, vanilla])

  // User textures decode asynchronously: repaint when one is ready.
  useEffect(() => onUserImage(repaint), [])

  // The paint itself (every render: it is cheap and keeps the screen in step with its props).
  useEffect(() => {
    const el = canvas.current
    if (!el || !ready) return
    const dpr = window.devicePixelRatio || 1
    el.width = Math.round(width * scale * dpr)
    el.height = Math.round(height * scale * dpr)
    const ctx = el.getContext("2d")!
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, width, height)
    animated.current = false
    const tick = Math.floor(performance.now() / TICK_MS)
    const font = assets?.peekFont() ?? null
    const note = (s: McSprite | null) => {
      if (s && isAnimated(s)) animated.current = true
      return s
    }
    const g: McGraphics = {
      ctx,
      tick,
      assets: assets ?? NO_ASSETS,
      font,
      fill: (color, x, y, w, h) => {
        ctx.fillStyle = color
        ctx.fillRect(x, y, w, h)
      },
      sprite: (id, x, y, w, h) => {
        const s = note(assets?.peekSprite(id) ?? null)
        if (s) drawGuiSprite(ctx, s, x, y, w, h, tick)
      },
      gui: (path, sx, sy, sw, sh, dx, dy, dw, dh) => {
        const s = assets?.peekGui(path)
        if (s) drawRegion(ctx, s, sx, sy, sw, sh, dx, dy, dw, dh)
      },
      item: (item, x, y, size = 16) => drawMcItem(ctx, assets ?? NO_ASSETS, item, x, y, size, tick, note),
      text: (text, x, y, color, shadow) => font && drawText(ctx, font, text, x, y, color, shadow),
      measure: (text) => (font ? measureText(font, text) : text.length * 6),
    }
    draw(g)
  })

  // Animated textures (and only those) keep the screen repainting at the game's 20 ticks a second.
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => animated.current && repaint(), TICK_MS)
    return () => clearInterval(timer)
  }, [ready])

  if (vanilla && status === "missing") return <McMissing label={label} onBuild={onBuild} className={className} />
  if (!ready) return <div role="status" aria-label={`Loading ${label}`} className={cn("animate-pulse rounded-md bg-surface-hover/60", className)} style={{ width: width * scale, height: height * scale }} />

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: width * scale, height: height * scale }}>
      <canvas ref={canvas} role="img" aria-label={label} className="block [image-rendering:pixelated]" style={{ width: width * scale, height: height * scale }} />
      {slots.map((slot) => {
        const size = slot.size ?? 18
        const button = (
          <button
            key={slot.key}
            type="button"
            aria-label={slot.label}
            aria-pressed={activeSlot === undefined ? undefined : activeSlot === slot.key}
            onClick={(e) => onSlot?.(slot.key, e)}
            onContextMenu={(e) => {
              if (!onSlotClear) return
              e.preventDefault()
              onSlotClear(slot.key)
            }}
            onKeyDown={(e) => {
              if (onSlotClear && (e.key === "Delete" || e.key === "Backspace")) {
                e.preventDefault()
                onSlotClear(slot.key)
              }
            }}
            className="absolute rounded-[1px] outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white aria-pressed:ring-2 aria-pressed:ring-white/80"
            style={{ left: slot.x * scale, top: slot.y * scale, width: size * scale, height: size * scale }}
          />
        )
        return wrapSlot ? <span key={slot.key}>{wrapSlot(slot, button)}</span> : button
      })}
    </div>
  )
}

const NO_ASSETS: McAssets = {
  preload: async () => {},
  peekTexture: () => null,
  peekSprite: () => null,
  peekGui: () => null,
  peekItem: () => null,
  peekTag: () => null,
  hasItem: async () => false,
  peekFont: () => null,
}

/** "Build once to load Minecraft's look": shown instead of a vanilla screen until the files exist. */
export function McMissing({ label, onBuild, className }: { label: string; onBuild?: () => void; className?: string }) {
  return (
    <div role="status" className={cn("flex max-w-sm flex-col items-center gap-2 rounded-lg bg-surface-hover/60 px-5 py-6 text-center", className)}>
      <p className="text-sm text-fg">Build once to load Minecraft's look</p>
      <p className="text-xs text-fg-muted">
        The {label.toLowerCase()} is drawn with the game's own pictures. They come from the copy Gradle downloads to your computer; Blocksy never stores or shares them.
      </p>
      {onBuild && (
        <Button size="sm" onClick={onBuild} className="mt-1 h-7">
          Prepare Minecraft
        </Button>
      )}
    </div>
  )
}
