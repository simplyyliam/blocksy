// A small picture of one item or block in the game's own look, for lists (the item picker, tag
// contents, the Library). It draws exactly what the slots in the screens draw. While Minecraft's
// files are not loaded (no build yet) or this item cannot be drawn, it shows `fallback`.
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react"
import { cn } from "../lib/utils.ts"
import { drawMcItem } from "./item.ts"
import { useMinecraft } from "./provider.tsx"
import type { McItem } from "./types.ts"
import { onUserImage } from "./user-images.ts"

interface Props {
  item: McItem
  /** Shown until the picture can be drawn. */
  fallback?: ReactNode
  className?: string
}

/** The icon's resolution: whole multiples of the game's 16 pixels, so edges stay crisp when scaled. */
const SCALE = 3

export function McItemIcon({ item, fallback = null, className }: Props) {
  "use no memo" // reads caches that change outside React (assets, user images)
  const { assets, status } = useMinecraft()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [loadedKey, setLoadedKey] = useState("")
  const [, repaint] = useReducer((n: number) => n + 1, 0)
  const key = JSON.stringify(item)
  // Vanilla things must be loaded first; the user's own pixels are drawn at once.
  const need = "vanilla" in item ? item.vanilla : "tag" in item ? `#${item.tag}` : null
  const ready = need === null || (status === "ready" && assets !== null && loadedKey === key)

  useEffect(() => {
    if (need === null || status !== "ready" || !assets) return
    let alive = true
    void assets.preload({ items: [need] }).then(() => alive && setLoadedKey(key))
    return () => {
      alive = false
    }
  }, [assets, status, need, key])

  useEffect(() => onUserImage(repaint), [])

  useEffect(() => {
    const el = canvas.current
    if (!el || !ready) return
    el.width = 16 * SCALE
    el.height = 16 * SCALE
    const ctx = el.getContext("2d")!
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, 16, 16)
    if (assets) drawMcItem(ctx, assets, item, 0, 0, 16, 0)
    else if (!("vanilla" in item) && !("tag" in item)) drawMcItem(ctx, NO_ASSETS, item, 0, 0, 16, 0)
  })

  if (!ready) return <>{fallback}</>
  return <canvas ref={canvas} aria-hidden className={cn("size-5 shrink-0 [image-rendering:pixelated]", className)} />
}

const NO_ASSETS = {
  preload: async () => {},
  peekTexture: () => null,
  peekSprite: () => null,
  peekGui: () => null,
  peekItem: () => null,
  peekTag: () => null,
  hasItem: async () => false,
  peekFont: () => null,
}
