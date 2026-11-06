// Drawing one item or block in the game's look, shared by the screens (McScreen) and the small
// icons in lists (McItemIcon). Vanilla things come from the game's own files through `McAssets`;
// the user's own things are drawn from their pixels. Nothing here is hand-drawn art: when the
// renderer cannot draw something yet it shows a quiet grey square, never a wrong picture.
import { drawCube, drawModel, drawSprite } from "./graphics.ts"
import type { McAssets, McItem, McSprite } from "./types.ts"
import { userSprite } from "./user-images.ts"

export function drawMcItem(ctx: CanvasRenderingContext2D, assets: McAssets, item: McItem, x: number, y: number, size: number, tick: number, note: (s: McSprite | null) => McSprite | null = (s) => s) {
  if ("texture" in item) {
    const s = note(userSprite(item.texture, item.animated?.frametime))
    if (s) drawSprite(ctx, s, x, y, size, size, tick)
    return
  }
  if ("blockTexture" in item) {
    const s = note(userSprite(item.blockTexture))
    if (s) drawCube(ctx, { top: s, left: s, right: s }, x, y, size, tick)
    return
  }
  // A tag is drawn as one of its items.
  const id = "tag" in item ? assets.peekTag(item.tag) : item.vanilla
  const render = id ? assets.peekItem(id) : null
  if (!render || render.kind === "unsupported") {
    ctx.fillStyle = "rgba(139,139,139,0.55)"
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4)
    return
  }
  if (render.kind === "flat") {
    for (const layer of render.layers) {
      const s = note(assets.peekTexture(layer))
      if (s) drawSprite(ctx, s, x, y, size, size, tick)
    }
    return
  }
  if (render.kind === "model") {
    drawModel(ctx, render.faces, render.pose, (t) => assets.peekTexture(t), x, y, size, tick, (s) => void note(s))
    return
  }
  const top = note(assets.peekTexture(render.top))
  const left = note(assets.peekTexture(render.left))
  const right = note(assets.peekTexture(render.right))
  if (top && left && right) drawCube(ctx, { top, left, right }, x, y, size, tick)
}
