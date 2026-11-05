// The vanilla asset reader (ADR 0011): Minecraft's own pictures and models, read from the
// copy already in the user's Gradle cache. It implements the renderer's `McAssets` contract.
//
//   Rust: opens the jar, returns raw bytes (shared/vanilla source)
//   here: decodes PNGs, reads .mcmeta, resolves ids to files (resolve.ts), builds the font
//
// Everything stays IN MEMORY: decoded images and parsed JSON live in these maps until the app
// closes. Nothing is written to the project, bundled, committed or uploaded.
import type { ItemRender, McAssets, McFont, McGlyph, McNeeds, McSprite } from "@blocksy/ui"
import { bitmapProviders, cellsOf, itemDefinitionEntry, parseMcmeta, referencedFonts, resolveItemRender, spriteEntry, spriteLayout, textureEntry, type JsonReader } from "./resolve"

/** Where the bytes come from: a jar in production, a fake in tests. */
export interface AssetSource {
  readBytes(entry: string): Promise<Uint8Array | null>
}

const decoder = new TextDecoder()

export class VanillaAssets implements McAssets {
  private sprites = new Map<string, Promise<McSprite | null>>()
  private spriteDone = new Map<string, McSprite | null>()
  private json = new Map<string, Promise<unknown | null>>()
  private items = new Map<string, ItemRender>()
  private font: McFont | null = null
  private fontPromise: Promise<McFont | null> | null = null

  private source: AssetSource

  constructor(source: AssetSource) {
    this.source = source
  }

  /** Parsed JSON from the jar (cached), or null if the file is not there. */
  readJson: JsonReader = (entry) => {
    let hit = this.json.get(entry)
    if (!hit) {
      hit = this.source
        .readBytes(entry)
        .then((bytes) => (bytes ? (JSON.parse(decoder.decode(bytes)) as unknown) : null))
        .catch(() => {
          this.json.delete(entry) // an error (jar gone, unreadable) is not an answer: ask again next time
          return null
        })
      this.json.set(entry, hit)
    }
    return hit
  }

  /** A decoded picture with its .mcmeta (animation, GUI scaling), keyed by jar entry. */
  private loadSprite(entry: string): Promise<McSprite | null> {
    let hit = this.sprites.get(entry)
    if (!hit) {
      hit = (async () => {
        const bytes = await this.source.readBytes(entry)
        if (!bytes) return null
        const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: "image/png" }))
        const mcmeta = parseMcmeta(await this.readJson(`${entry}.mcmeta`))
        const layout = spriteLayout(bitmap.width, bitmap.height, mcmeta)
        return {
          image: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          frameWidth: layout.frameWidth,
          frameHeight: layout.frameHeight,
          sequence: layout.sequence,
          interpolate: mcmeta.animation?.interpolate ?? false,
          scaling: mcmeta.scaling,
        } satisfies McSprite
      })().catch(() => {
        this.sprites.delete(entry) // not remembered: the file may be readable next time
        return null
      })
      this.sprites.set(entry, hit)
      void hit.then((s) => this.spriteDone.set(entry, s))
    }
    return hit
  }

  private peek(entry: string | null): McSprite | null {
    return entry ? (this.spriteDone.get(entry) ?? null) : null
  }

  peekTexture = (id: string) => this.peek(textureEntry(id))
  peekSprite = (id: string) => this.peek(spriteEntry(id))
  peekGui = (path: string) => this.peek(textureEntry(`minecraft:gui/${path}`))
  peekItem = (id: string) => this.items.get(id) ?? null
  peekFont = () => this.font

  async preload(needs: McNeeds): Promise<void> {
    const jobs: Promise<unknown>[] = []
    for (const id of needs.textures ?? []) jobs.push(this.loadSprite(textureEntry(id) ?? ""))
    for (const id of needs.sprites ?? []) jobs.push(this.loadSprite(spriteEntry(id) ?? ""))
    for (const path of needs.gui ?? []) jobs.push(this.loadSprite(textureEntry(`minecraft:gui/${path}`) ?? ""))
    for (const id of needs.items ?? []) jobs.push(this.loadItem(id))
    if (needs.font) jobs.push(this.loadFont())
    await Promise.all(jobs)
  }

  /** Resolves an item (or a block's item) to what to draw and loads the textures it names. */
  private async loadItem(id: string) {
    if (this.items.has(id)) return
    const render = await resolveItemRender(this.readJson, id)
    this.items.set(id, render)
    const textures = render.kind === "flat" ? render.layers : render.kind === "cube" ? [render.top, render.left, render.right] : []
    await Promise.all(textures.map((t) => this.loadSprite(textureEntry(t) ?? "")))
  }

  /** Does this item exist in the game's files? (Used to tell vanilla items from typos.) */
  async hasItem(id: string): Promise<boolean> {
    const entry = itemDefinitionEntry(id)
    return entry ? (await this.readJson(entry)) !== null : false
  }

  private loadFont(): Promise<McFont | null> {
    this.fontPromise ??= this.buildFont().then((f) => (this.font = f))
    return this.fontPromise
  }

  /** The default font: its bitmap sheets, cut into glyphs with the width measured from the pixels. */
  private async buildFont(): Promise<McFont | null> {
    const seen = new Set<string>()
    const providers: ReturnType<typeof bitmapProviders> = []
    const visit = async (id: string, depth: number) => {
      const ns = id.includes(":") ? id : `minecraft:${id}`
      if (seen.has(ns) || depth > 4) return
      seen.add(ns)
      const path = ns.split(":")[1]
      const file = await this.readJson(`assets/minecraft/font/${path}.json`)
      if (!file) return
      providers.push(...bitmapProviders(file))
      for (const ref of referencedFonts(file)) await visit(ref, depth + 1)
    }
    await visit("default", 0)
    if (providers.length === 0) return null

    const glyphs = new Map<string, McGlyph>()
    for (const provider of providers) {
      // Font providers name the file with its extension ("minecraft:font/ascii.png").
      const sheet = await this.loadSprite(textureEntry(provider.file.replace(/\.png$/, "")) ?? "")
      if (!sheet) continue
      const rows = provider.chars.length
      const cols = Math.max(...provider.chars.map((r) => [...r].length))
      const cellW = sheet.width / cols
      const cellH = sheet.height / rows
      const pixels = readPixels(sheet)
      for (const [ch, { col, row }] of cellsOf(provider)) {
        if (glyphs.has(ch)) continue
        const sx = col * cellW
        const sy = row * cellH
        // Width = the last column with any visible pixel; the pen moves one more pixel.
        const width = pixels ? visibleWidth(pixels, sheet.width, sx, sy, cellW, cellH) : cellW
        glyphs.set(ch, { sheet, sx, sy, width: Math.max(1, width), height: cellH, advance: Math.max(1, width) + 1 })
      }
    }
    const first = [...glyphs.values()][0]
    if (!first) return null // no sheet could be read: text falls back to plain placeholders
    glyphs.set(" ", { sheet: first.sheet, sx: 0, sy: 0, width: 0, height: 0, advance: 4 })
    return { glyph: (ch) => glyphs.get(ch) ?? glyphs.get("?") ?? null, lineHeight: 8 }
  }
}

/** RGBA pixels of a sprite (browser only); null if the canvas cannot be read. */
function readPixels(sprite: McSprite): Uint8ClampedArray | null {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = sprite.width
    canvas.height = sprite.height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.drawImage(sprite.image, 0, 0)
    return ctx.getImageData(0, 0, sprite.width, sprite.height).data
  } catch {
    return null
  }
}

/** Rightmost visible column (+1) inside a glyph cell. */
export function visibleWidth(pixels: ArrayLike<number>, sheetWidth: number, sx: number, sy: number, cellW: number, cellH: number): number {
  let widest = 0
  for (let y = 0; y < cellH; y++) {
    for (let x = cellW - 1; x >= widest; x--) {
      if (pixels[((sy + y) * sheetWidth + (sx + x)) * 4 + 3]! > 0) {
        widest = x + 1
        break
      }
    }
  }
  return widest
}
