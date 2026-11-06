// How Minecraft's own asset files fit together, as pure functions (ADR 0011). Rust only
// returns bytes from the jar; this file knows what the paths mean:
//
//   "minecraft:item/apple"  -> assets/minecraft/textures/item/apple.png (+ .png.mcmeta)
//   a GUI sprite            -> assets/minecraft/textures/gui/sprites/<path>.png
//   an item                 -> assets/minecraft/items/<id>.json -> a model -> its parents -> textures
//
// Nothing here touches the disk or the DOM, so it is tested with small fake files.

import type { ItemRender, ModelFace, SpriteScaling, Vec3 } from "@blocksy/ui"

export type { ItemRender, SpriteScaling }

// The game's JSON files are untrusted shapes we read defensively, so `any` is deliberate here.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type JsonReader = (entry: string) => Promise<unknown | null>

/** "minecraft:item/apple" or "item/apple" -> ["minecraft", "item/apple"]. Rejects odd ids. */
export function splitId(id: string, defaultNamespace = "minecraft"): [string, string] | null {
  const [ns, path] = id.includes(":") ? (id.split(":", 2) as [string, string]) : [defaultNamespace, id]
  const plain = /^[a-z0-9_.-]+$/.test(ns) && /^[a-z0-9_./-]+$/.test(path) && !path.includes("..")
  return plain ? [ns, path] : null
}

export const textureEntry = (id: string) => entryFor(id, (ns, p) => `assets/${ns}/textures/${p}.png`)
export const spriteEntry = (id: string) => entryFor(id, (ns, p) => `assets/${ns}/textures/gui/sprites/${p}.png`)
export const modelEntry = (id: string) => entryFor(id, (ns, p) => `assets/${ns}/models/${p}.json`)
export const itemDefinitionEntry = (id: string) => entryFor(id, (ns, p) => `assets/${ns}/items/${p}.json`)

function entryFor(id: string, make: (ns: string, path: string) => string): string | null {
  const parts = splitId(id)
  return parts ? make(...parts) : null
}

// ---- .mcmeta: animation and GUI scaling ---------------------------------------------------

export interface Mcmeta {
  animation?: {
    frametime: number
    interpolate: boolean
    width?: number
    height?: number
    /** Frame order, each a frame index with how many ticks it shows (default: frametime). */
    frames?: { index: number; time: number }[]
  }
  scaling: SpriteScaling
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback)

export function parseMcmeta(json: unknown): Mcmeta {
  const root = (json ?? {}) as Record<string, any>
  const result: Mcmeta = { scaling: { type: "stretch" } }

  if (root.animation && typeof root.animation === "object") {
    const a = root.animation
    const frametime = Math.max(1, Math.round(num(a.frametime, 1)))
    result.animation = {
      frametime,
      interpolate: a.interpolate === true,
      width: typeof a.width === "number" ? a.width : undefined,
      height: typeof a.height === "number" ? a.height : undefined,
      frames: Array.isArray(a.frames)
        ? a.frames.map((f: unknown) =>
            typeof f === "number" ? { index: f, time: frametime } : { index: num((f as any)?.index, 0), time: Math.max(1, Math.round(num((f as any)?.time, frametime))) },
          )
        : undefined,
    }
  }

  const s = root.gui?.scaling
  if (s && typeof s === "object") {
    const width = num(s.width, 0)
    const height = num(s.height, 0)
    if (s.type === "tile" && width > 0 && height > 0) result.scaling = { type: "tile", width, height }
    if (s.type === "nine_slice" && width > 0 && height > 0) {
      const b = s.border
      const border =
        typeof b === "number" ? { left: b, top: b, right: b, bottom: b } : { left: num(b?.left, 0), top: num(b?.top, 0), right: num(b?.right, 0), bottom: num(b?.bottom, 0) }
      result.scaling = { type: "nine_slice", width, height, border }
    }
  }
  return result
}

export interface SpriteLayout {
  frameWidth: number
  frameHeight: number
  /** Which source frames play, in order, each with its length in ticks. */
  sequence: { index: number; time: number }[]
}

/**
 * Cuts a texture into animation frames. Without an animation the whole image is one frame.
 * With one, frames are stacked top to bottom; they are `width x height` when the .mcmeta says so,
 * otherwise square (as wide as the image), which is how Blocksy writes item strips.
 */
export function spriteLayout(imageWidth: number, imageHeight: number, mcmeta: Mcmeta): SpriteLayout {
  const a = mcmeta.animation
  if (!a) return { frameWidth: imageWidth, frameHeight: imageHeight, sequence: [{ index: 0, time: 1 }] }
  const frameWidth = a.width ?? imageWidth
  const frameHeight = a.height ?? (a.width ? a.width : Math.min(imageWidth, imageHeight))
  const perRow = Math.max(1, Math.floor(imageWidth / frameWidth))
  const rows = Math.max(1, Math.floor(imageHeight / frameHeight))
  const total = perRow * rows
  const sequence = a.frames?.length ? a.frames.filter((f) => f.index >= 0 && f.index < total) : Array.from({ length: total }, (_, index) => ({ index, time: a.frametime }))
  return { frameWidth, frameHeight, sequence: sequence.length ? sequence : [{ index: 0, time: a.frametime }] }
}

// ---- Item and block models -----------------------------------------------------------------

interface RawElement {
  from?: number[]
  to?: number[]
  rotation?: { origin?: number[]; axis?: string; angle?: number }
  faces?: Record<string, { texture?: string; uv?: number[]; rotation?: number; tintindex?: number }>
}

interface Model {
  parent?: string
  textures?: Record<string, string>
  elements?: RawElement[]
  display?: { gui?: { rotation?: number[] } }
}

const MAX_PARENT_DEPTH = 10

/** The model id an item definition points at, picking the plain/default branch of any switch. */
export function modelIdOf(definition: any, depth = 0): string | null {
  if (!definition || typeof definition !== "object" || depth > 6) return null
  const node = definition.model ?? definition
  if (typeof node === "string") return node
  if (!node || typeof node !== "object") return null
  if (node.type === "minecraft:model" || (node.type === undefined && typeof node.model === "string")) return typeof node.model === "string" ? node.model : null
  if (node.type === "minecraft:special") return typeof node.base === "string" ? node.base : null
  const branches = [node.on_false, node.fallback, node.on_true, node.cases?.[0]?.model, node.entries?.[0]?.model, node.models?.[0]]
  for (const b of branches) {
    const found = modelIdOf({ model: b }, depth + 1)
    if (found) return found
  }
  return null
}

/** A texture reference as written in a model: a string, or (newer games) an object with the texture as `sprite`. */
function textureName(value: unknown): string | undefined {
  if (typeof value === "string") return value
  const sprite = (value as { sprite?: unknown } | null | undefined)?.sprite
  return typeof sprite === "string" ? sprite : undefined
}

function resolveTexture(ref: unknown, textures: Record<string, string>): string | null {
  let current = textureName(ref)
  for (let i = 0; i < 8 && current?.startsWith("#"); i++) current = textureName(textures[current.slice(1)])
  return current && !current.startsWith("#") ? current : null
}

/** Follows a model's `parent` chain: merged textures, the first `elements`, the inventory pose and the root parent id. */
async function loadModelChain(readJson: JsonReader, modelId: string) {
  const textures: Record<string, string> = {}
  let elements: Model["elements"]
  let pose: number[] | undefined
  let root = modelId
  let id: string | undefined = modelId
  for (let depth = 0; id && depth < MAX_PARENT_DEPTH; depth++) {
    root = id
    const entry = modelEntry(id)
    const model = (entry ? await readJson(entry) : null) as Model | null
    if (!model) break
    for (const [key, value] of Object.entries(model.textures ?? {})) {
      const name = textureName(value)
      if (name) textures[key] ??= name // the child wins
    }
    elements ??= model.elements
    pose ??= model.display?.gui?.rotation
    id = model.parent
  }
  return { textures, elements, pose, root }
}

const vec = (v: number[] | undefined, fallback: Vec3): Vec3 => (v && v.length >= 3 && v.every((n) => typeof n === "number" && Number.isFinite(n)) ? [v[0]!, v[1]!, v[2]!] : fallback)

/** The texture rectangle a face shows when the model gives no `uv` (the game's own rule per direction). */
function defaultUv(dir: ModelFace["dir"], from: Vec3, to: Vec3): ModelFace["uv"] {
  const [x0, y0, z0] = from
  const [x1, y1, z1] = to
  switch (dir) {
    case "up":
      return [x0, z0, x1, z1]
    case "south":
      return [x0, 16 - y1, x1, 16 - y0]
    case "north":
      return [16 - x1, 16 - y1, 16 - x0, 16 - y0]
    case "east":
      return [16 - z1, 16 - y1, 16 - z0, 16 - y0]
    case "west":
      return [z0, 16 - y1, z1, 16 - y0]
  }
}

const FACE_DIRS = ["up", "north", "south", "east", "west"] as const

/** Every drawable face of a block model (stairs, slabs, fences, ...) with its texture resolved. */
export function buildFaces(elements: RawElement[], textures: Record<string, string>): ModelFace[] {
  const faces: ModelFace[] = []
  for (const element of elements) {
    const from = vec(element.from, [0, 0, 0])
    const to = vec(element.to, [16, 16, 16])
    const r = element.rotation
    const rotation = r && (r.axis === "x" || r.axis === "y" || r.axis === "z") && typeof r.angle === "number" && r.angle !== 0 ? { origin: vec(r.origin, [8, 8, 8]), axis: r.axis as "x" | "y" | "z", angle: r.angle } : undefined
    for (const dir of FACE_DIRS) {
      const face = element.faces?.[dir]
      const texture = face && resolveTexture(face.texture, textures)
      if (!face || !texture) continue
      const uv = face.uv && face.uv.length >= 4 && face.uv.every((n) => typeof n === "number") ? ([face.uv[0]!, face.uv[1]!, face.uv[2]!, face.uv[3]!] as ModelFace["uv"]) : defaultUv(dir, from, to)
      const uvRotation = (((Math.round((face.rotation ?? 0) / 90) % 4) + 4) % 4) * 90
      faces.push({ dir, from, to, rotation, uv, uvRotation, texture, tinted: typeof face.tintindex === "number" })
    }
  }
  return faces
}

/** The first item of a vanilla item tag, following nested tags ("#minecraft:logs" -> "minecraft:oak_log"). */
export async function resolveTagItem(readJson: JsonReader, tagId: string, depth = 0): Promise<string | null> {
  const parts = splitId(tagId.replace(/^#/, ""))
  if (!parts || depth > 5) return null
  const file = (await readJson(`data/${parts[0]}/tags/item/${parts[1]}.json`)) as { values?: unknown[] } | null
  for (const value of file?.values ?? []) {
    const id = typeof value === "string" ? value : (value as { id?: unknown } | null)?.id
    if (typeof id !== "string") continue
    if (id.startsWith("#")) {
      const nested = await resolveTagItem(readJson, id.slice(1), depth + 1)
      if (nested) return nested
    } else {
      return id.includes(":") ? id : `minecraft:${id}`
    }
  }
  return null
}

/** How to draw an item (or a block's item) in a slot, from the game's own files. */
export async function resolveItemRender(readJson: JsonReader, itemId: string): Promise<ItemRender> {
  const defEntry = itemDefinitionEntry(itemId)
  const definition = defEntry ? await readJson(defEntry) : null
  const modelId = modelIdOf(definition) ?? (splitId(itemId) ? `item/${splitId(itemId)![1]}` : null)
  if (!modelId) return { kind: "unsupported" }
  const { textures, elements, pose, root } = await loadModelChain(readJson, modelId)

  // "minecraft:item/generated" is the flat-sprite parent: layer0, layer1, ...
  if (/(^|:)(item\/generated|builtin\/generated)$/.test(root) || (!elements && textures.layer0)) {
    const layers: string[] = []
    for (let i = 0; textures[`layer${i}`]; i++) {
      const t = resolveTexture(`#layer${i}`, textures)
      if (t) layers.push(t)
    }
    return layers.length ? { kind: "flat", layers } : { kind: "unsupported" }
  }
  if (/builtin\/entity$/.test(root)) return { kind: "unsupported" }

  if (!elements?.length) return { kind: "unsupported" }

  // A plain full block (one element, no rotation): the fast cube.
  const only = elements.length === 1 ? elements[0]! : null
  const full = only && !only.rotation && vec(only.from, [0, 0, 0]).every((n) => n === 0) && vec(only.to, [16, 16, 16]).every((n) => n === 16)
  if (full) {
    const faces = only.faces
    const pick = (...names: string[]) => resolveTexture(names.map((n) => faces?.[n]?.texture).find(Boolean), textures)
    const top = pick("up")
    const left = pick("south", "north")
    const right = pick("east", "west")
    if (top && left && right) return { kind: "cube", top, left, right }
  }

  // Anything else (stairs, slabs, fences, panes, ...): its real shape, element by element.
  const faces = buildFaces(elements, textures)
  return faces.length ? { kind: "model", faces, pose: vec(pose, [30, 225, 0]) } : { kind: "unsupported" }
}

// ---- Font ----------------------------------------------------------------------------------

export interface BitmapProvider {
  file: string
  height: number
  ascent: number
  /** One string per row of the sheet; each character is one cell ("\u0000" = empty). */
  chars: string[]
}

/** The bitmap providers of a font definition (the default font is a list of them plus unifont). */
export function bitmapProviders(font: unknown): BitmapProvider[] {
  const providers = ((font ?? {}) as { providers?: any[] }).providers ?? []
  return providers
    .filter((p) => p?.type === "bitmap" && typeof p.file === "string" && Array.isArray(p.chars))
    .map((p) => ({ file: p.file as string, height: num(p.height, 8), ascent: num(p.ascent, 7), chars: (p.chars as unknown[]).filter((r): r is string => typeof r === "string") }))
}

/** Where each character sits in a sheet, in cells (column, row). Skips empty cells. */
export function cellsOf(provider: BitmapProvider): Map<string, { col: number; row: number }> {
  const cells = new Map<string, { col: number; row: number }>()
  provider.chars.forEach((rowText, row) => {
    ;[...rowText].forEach((ch, col) => {
      if (ch !== "\u0000" && ch !== " " && !cells.has(ch)) cells.set(ch, { col, row })
    })
  })
  return cells
}

/** "include" providers point to other font files: `{ "type": "reference", "id": "minecraft:include/default" }`. */
export function referencedFonts(font: unknown): string[] {
  const providers = ((font ?? {}) as { providers?: any[] }).providers ?? []
  return providers.filter((p) => p?.type === "reference" && typeof p.id === "string").map((p) => p.id as string)
}
