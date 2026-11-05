// The user's own textures (base64 PNGs in their project) as sprites the renderer can draw.
// These are the user's files, so they show immediately, with or without Minecraft's assets.
// Decoded once per picture and kept in memory; `onUserImage` tells screens to repaint.
import type { McSprite } from "./types.ts"

const cache = new Map<string, McSprite | "loading" | "failed">()
const listeners = new Set<() => void>()

export function onUserImage(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** A decoded sprite, or null while it loads (a repaint is announced when it is ready). */
export function userSprite(base64: string, frametime?: number): McSprite | null {
  const key = `${frametime ?? 0}|${base64}`
  const hit = cache.get(key)
  if (hit && hit !== "loading" && hit !== "failed") return hit
  if (hit) return null
  cache.set(key, "loading")
  const image = new Image()
  image.onload = () => {
    // Tall strips are animations: square frames, as wide as the picture (how Blocksy writes them).
    const frames = frametime && image.height > image.width ? Math.floor(image.height / image.width) : 1
    cache.set(key, {
      image,
      width: image.width,
      height: image.height,
      frameWidth: image.width,
      frameHeight: frames > 1 ? image.width : image.height,
      sequence: Array.from({ length: frames }, (_, index) => ({ index, time: Math.max(1, frametime ?? 1) })),
      interpolate: false,
      scaling: { type: "stretch" },
    })
    listeners.forEach((l) => l())
  }
  image.onerror = () => cache.set(key, "failed")
  image.src = `data:image/png;base64,${base64}`
  return null
}
