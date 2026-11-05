// The Minecraft renderer's contract with the app (ADR 0011). The renderer lives in
// packages/ui and never touches Tauri or the Gradle cache: the app implements `McAssets`
// (reading Minecraft's own files from the user's machine, in memory only) and gives it to
// <MinecraftProvider>. Without it, every component shows a calm "Build once" placeholder.

export type NineSliceBorder = { left: number; top: number; right: number; bottom: number }

/** How a GUI sprite scales when drawn bigger than its image (`gui.scaling` in .mcmeta). */
export type SpriteScaling =
  | { type: "stretch" }
  | { type: "tile"; width: number; height: number }
  | { type: "nine_slice"; width: number; height: number; border: NineSliceBorder }

/** A decoded picture, possibly an animation strip. */
export interface McSprite {
  image: CanvasImageSource
  /** Size of the whole image. */
  width: number
  height: number
  /** Size of one animation frame (the image itself when not animated). */
  frameWidth: number
  frameHeight: number
  /** Frame playback order, each frame with its length in game ticks (50 ms). */
  sequence: { index: number; time: number }[]
  interpolate: boolean
  scaling: SpriteScaling
}

/** What to draw for an item or block inside a slot. */
export type ItemRender =
  | { kind: "flat"; layers: string[] }
  | { kind: "cube"; top: string; left: string; right: string }
  | { kind: "unsupported" }

/** One glyph of the game's bitmap font, cut out of a sheet. */
export interface McGlyph {
  sheet: McSprite
  sx: number
  sy: number
  width: number
  height: number
  /** How far the pen moves after drawing it. */
  advance: number
}

export interface McFont {
  glyph(char: string): McGlyph | null
  /** Pixel height of a line in the sheet (8 for the default font). */
  lineHeight: number
}

/** What the renderer asks of the app. Loading is async and cached; `peek*` read the cache. */
export interface McAssets {
  /** Loads these before a screen paints, so drawing stays synchronous. */
  preload(needs: McNeeds): Promise<void>
  /** A texture by id, e.g. "minecraft:item/apple" (cache only; null until preloaded). */
  peekTexture(id: string): McSprite | null
  /** A GUI sprite by id, e.g. "minecraft:container/slot". */
  peekSprite(id: string): McSprite | null
  /** A full GUI picture below textures/gui, e.g. "container/furnace" (256-style sheets). */
  peekGui(path: string): McSprite | null
  /** How an item or block draws (cache only). */
  peekItem(id: string): ItemRender | null
  peekFont(): McFont | null
}

export interface McNeeds {
  textures?: string[]
  sprites?: string[]
  gui?: string[]
  items?: string[]
  font?: boolean
}

export type McStatus = "loading" | "ready" | "missing"

/** An item shown in the game's own look: vanilla (by id) or the user's (their own pixels). */
export type McItem =
  | { vanilla: string }
  /** The user's own item or block: base64 PNG (16 wide; animated ones are tall strips). */
  | { texture: string; animated?: { frametime: number } }
  /** The user's block: one texture on all faces, drawn as a cube. */
  | { blockTexture: string }
